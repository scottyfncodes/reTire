import type {
  Adventure,
  Camp,
  FoodStop,
  Hike,
  Itinerary,
  ItineraryLeg,
  Measure,
  PlanConstraints,
  ExperienceProfile,
  Stop,
  Warning,
} from '../data/types'
import { CAMPS_BY_ID } from '../data/camps'
import { FOOD_BY_ID } from '../data/food'
import { HIKES_BY_ID } from '../data/hikes'
import { STOPS_BY_ID } from '../data/stops'
import { HOME } from '../data/adventures'
import {
  estimateDrive,
  hardestVehicle,
  ROAD_CLASS_LABEL,
  VEHICLE_LABEL,
  worstCaseMinutes,
} from './drive'
import { estimateHike } from './hike'
import { classifyDepth } from './depth'
import { seasonWarnings } from './season'
import {
  addMeasures,
  formatMeasure,
  high,
  low,
  maxMeasure,
  mid,
  sumMeasures,
} from './measure'
import { formatClock, formatDuration, MINUTES_PER_DAY } from './time'

/** Boots, packs, the permit box, the last look at the map. */
export const TRAILHEAD_BUFFER_MINUTES = 15

/** Setting up a rooftop tent and making camp liveable. */
export const CAMP_SETUP_MINUTES = 45

export const FOOD_MINUTES: Record<PlanConstraints['food'], number> = {
  none: 0,
  lunch: 60,
  brewery: 75,
  dinner: 90,
  surprise: 75,
}

export interface BuildOptions {
  adventure: Adventure
  constraints: PlanConstraints
  profile: ExperienceProfile
  /** Explicit picks that override the adventure defaults. */
  hikeId?: string | null
  foodId?: string | null
  campId?: string | null
  /** Sunrise/sunset in minutes after midnight, when a forecast is available. */
  daylight?: { sunrise: number; sunset: number } | null
  overnight?: boolean
}

interface Cursor {
  at: number
  legs: ItineraryLeg[]
}

function push(
  cursor: Cursor,
  leg: Omit<ItineraryLeg, 'startMinutes' | 'endMinutes'> & { minutes: number },
): void {
  const { minutes, ...rest } = leg
  cursor.legs.push({
    ...rest,
    startMinutes: cursor.at,
    endMinutes: cursor.at + minutes,
  })
  cursor.at += minutes
}

/**
 * Turns an adventure plus the day's constraints into an actual timed plan.
 *
 * Durations come from the drive and hike models; anything modelled is flagged
 * `estimated` so the UI can say so. Nothing here invents a number that the
 * data layer left as UNKNOWN -- unmeasured legs are counted and reported, and
 * the totals become floors rather than being quietly rounded up from nothing.
 */
export function buildItinerary(options: BuildOptions): Itinerary {
  const { adventure, constraints, profile, daylight } = options

  const hike = pickHike(adventure, options.hikeId, constraints)
  const food = pickFood(adventure, options.foodId, constraints)
  const camp = pickCamp(adventure, options.campId)
  const overnight = Boolean(options.overnight) && camp !== null

  const stops = adventure.stopIds
    .map((id) => STOPS_BY_ID[id])
    .filter((s): s is Stop => Boolean(s))

  const outbound = estimateDrive(adventure.outbound)
  const inbound = estimateDrive(adventure.returnVia ?? adventure.outbound)

  const hikeEstimate = hike
    ? estimateHike(hike, profile.paceMph, breakFractionFor(constraints))
    : null

  const cursor: Cursor = { at: constraints.earliestDeparture, legs: [] }

  push(cursor, {
    kind: 'depart',
    title: `Leave ${HOME.label}`,
    detail: `Rolling at ${formatClock(constraints.earliestDeparture)}.`,
    minutes: 0,
    estimated: false,
  })

  for (const segment of adventure.outbound) {
    const { minutes, sourced } = segmentTiming(segment)
    push(cursor, {
      kind: 'drive',
      title: segment.via,
      detail: driveDetail(segment),
      minutes,
      vehicle: segment.vehicle,
      estimated: !sourced,
    })
  }

  // On the ground at the destination: look around first, walk second.
  const destinationStops = stops.filter(
    (s) => s.kind !== 'town' && s.dwellMinutes !== null,
  )
  const returnStops = stops.filter((s) => s.kind === 'town' && s.dwellMinutes !== null)

  const stopBudget = stopBudgetFor(constraints, Boolean(hike))
  let spentOnStops = 0
  for (const stop of destinationStops) {
    const dwell = stop.dwellMinutes as number
    if (spentOnStops + dwell > stopBudget) continue
    spentOnStops += dwell
    push(cursor, {
      kind: 'stop',
      title: stop.name,
      detail: stop.blurb,
      minutes: dwell,
      refId: stop.id,
      estimated: true,
    })
  }

  if (hike && hikeEstimate) {
    push(cursor, {
      kind: 'stop',
      title: 'Trailhead',
      detail: 'Boots, packs, water, a last look at the map and the weather.',
      minutes: TRAILHEAD_BUFFER_MINUTES,
      estimated: true,
    })
    const hikeMinutes = mid(hikeEstimate.minutesWithBreaks)
    push(cursor, {
      kind: 'hike',
      title: hike.name,
      detail: hikeDetail(hike, hikeEstimate.minutesWithBreaks),
      minutes: hikeMinutes ?? 0,
      refId: hike.id,
      estimated: true,
    })
  }

  // Food away from Durango happens before the drive home.
  const foodAwayFromHome = food !== null && food.town !== 'Durango'
  if (food && foodAwayFromHome && !overnight) {
    push(cursor, {
      kind: 'food',
      title: food.name,
      detail: foodDetail(food),
      minutes: FOOD_MINUTES[constraints.food] || FOOD_MINUTES.surprise,
      refId: food.id,
      estimated: true,
    })
  }

  if (overnight && camp) {
    push(cursor, {
      kind: 'camp',
      title: `Make camp: ${camp.name}`,
      detail: campDetail(camp),
      minutes: CAMP_SETUP_MINUTES,
      refId: camp.id,
      estimated: true,
    })
  } else {
    for (const stop of returnStops) {
      const dwell = stop.dwellMinutes as number
      if (spentOnStops + dwell > stopBudget) continue
      spentOnStops += dwell
      push(cursor, {
        kind: 'stop',
        title: stop.name,
        detail: stop.blurb,
        minutes: dwell,
        refId: stop.id,
        estimated: true,
      })
    }

    if (adventure.returnVia) {
      // A genuinely different way home: each leg is authored for this
      // direction, so show them as written.
      for (const segment of adventure.returnVia) {
        const { minutes, sourced } = segmentTiming(segment)
        push(cursor, {
          kind: 'drive',
          title: `Return: ${segment.via}`,
          detail: driveDetail(segment),
          minutes,
          vehicle: segment.vehicle,
          estimated: !sourced,
        })
      }
    } else {
      // Retracing. The outbound leg names are written for the outbound
      // direction ("US 550 north..."), so repeating them on the way home
      // would have the plan driving north to get back to Durango. Collapse
      // the retrace into one leg that names the roads in the order they are
      // actually met, which is also what anyone needs on the way home.
      const back = [...adventure.outbound].reverse()
      const minutes = back.reduce(
        (sum, segment) => sum + segmentTiming(segment).minutes,
        0,
      )
      const sourced = back.every((segment) => segmentTiming(segment).sourced)
      push(cursor, {
        kind: 'drive',
        title: `Retrace to ${HOME.label}`,
        detail: returnDetail(back),
        minutes,
        vehicle: hardestVehicle(back.map((segment) => segment.vehicle)),
        estimated: !sourced,
      })
    }

    if (food && !foodAwayFromHome) {
      push(cursor, {
        kind: 'food',
        title: food.name,
        detail: foodDetail(food),
        minutes: FOOD_MINUTES[constraints.food] || FOOD_MINUTES.surprise,
        refId: food.id,
        estimated: true,
      })
    }

    push(cursor, {
      kind: 'arrive',
      title: `Home, ${HOME.label}`,
      detail: `Back at ${formatClock(cursor.at)}.`,
      minutes: 0,
      estimated: false,
    })
  }

  const driveMinutes = cursor.legs
    .filter((l) => l.kind === 'drive')
    .reduce((sum, l) => sum + (l.endMinutes - l.startMinutes), 0)
  const hikeMinutes = cursor.legs
    .filter((l) => l.kind === 'hike')
    .reduce((sum, l) => sum + (l.endMinutes - l.startMinutes), 0)

  const driveMiles = overnight
    ? outbound.miles
    : addNullable(outbound.miles, inbound.miles)
  const unmeasuredLegs = overnight
    ? outbound.unmeasuredLegs
    : outbound.unmeasuredLegs + inbound.unmeasuredLegs

  const maxElevationFt = maxMeasure([
    hike ? hike.highPointFt : null,
    ...stops.map((s) => s.elevationFt),
    overnight && camp ? camp.elevationFt : null,
  ])

  const vehicle = hardestVehicle([
    outbound.vehicle,
    overnight ? outbound.vehicle : inbound.vehicle,
    ...(hike ? [hike.parking.finalApproach] : []),
    ...(overnight && camp ? [camp.access] : []),
  ])

  const totalMinutes = cursor.at - constraints.earliestDeparture

  const depth = classifyDepth({
    totalMinutes,
    hikeMiles: hike?.miles ?? null,
    gainFt: hike?.gainFt ?? null,
    maxElevationFt,
    overnight,
    technicalDriving: vehicle === 'four_wd_low_range',
  })

  const itinerary: Itinerary = {
    adventureId: adventure.id,
    date: constraints.date,
    legs: cursor.legs,
    departMinutes: constraints.earliestDeparture,
    homeMinutes: cursor.at,
    driveMinutes,
    hikeMinutes,
    totalMinutes,
    driveMiles,
    hikeMiles: hike?.miles ?? null,
    gainFt: hike?.gainFt ?? null,
    maxElevationFt,
    depth,
    vehicle,
    overnight,
    unmeasuredLegs,
    warnings: [],
    hikeId: hike?.id ?? null,
    foodId: food?.id ?? null,
    campId: overnight ? (camp?.id ?? null) : null,
  }

  itinerary.warnings = collectWarnings(itinerary, {
    adventure,
    constraints,
    profile,
    hike,
    camp: overnight ? camp : null,
    daylight: daylight ?? null,
    outboundMinutes: outbound.minutes,
  })

  return itinerary
}

/* --------------------------------------------------------------- warnings */

interface WarningContext {
  adventure: Adventure
  constraints: PlanConstraints
  profile: ExperienceProfile
  hike: Hike | null
  camp: Camp | null
  daylight: { sunrise: number; sunset: number } | null
  outboundMinutes: Measure
}

function collectWarnings(
  itinerary: Itinerary,
  ctx: WarningContext,
): Warning[] {
  const warnings: Warning[] = []
  const { adventure, constraints, profile, hike, camp, daylight } = ctx

  warnings.push(...seasonWarnings(adventure.season, constraints.date, adventure.name))
  if (hike) {
    warnings.push(...seasonWarnings(hike.season, constraints.date, hike.name))
  }
  if (camp) {
    warnings.push(...seasonWarnings(camp.season, constraints.date, camp.name))
  }

  if (!itinerary.overnight) {
    if (itinerary.homeMinutes > constraints.homeByMinutes) {
      const over = itinerary.homeMinutes - constraints.homeByMinutes
      warnings.push({
        level: over > 90 ? 'blocker' : 'caution',
        message: `Gets you home at ${formatClock(itinerary.homeMinutes)}, which is ${formatDuration(over)} past your ${formatClock(constraints.homeByMinutes)} target.`,
      })
    }
    if (itinerary.homeMinutes >= MINUTES_PER_DAY) {
      warnings.push({
        level: 'blocker',
        message: 'This plan runs past midnight. Start earlier, cut the hike, or make it an overnighter.',
      })
    }
  }

  const oneWayDrive = worstCaseMinutes(ctx.outboundMinutes)
  if (oneWayDrive > constraints.maxDriveMinutes) {
    warnings.push({
      level: 'caution',
      message: `One-way driving is about ${formatDuration(oneWayDrive)}, over your ${formatDuration(constraints.maxDriveMinutes)} limit.`,
    })
  }

  if (itinerary.vehicle === 'unknown') {
    warnings.push({
      level: 'caution',
      message: 'ACCESS STATUS UNKNOWN on part of this route. Confirm with the land manager before you commit to it.',
    })
  }

  if (itinerary.unmeasuredLegs > 0) {
    warnings.push({
      level: 'info',
      message: `${itinerary.unmeasuredLegs} road leg${itinerary.unmeasuredLegs === 1 ? '' : 's'} on this route ${itinerary.unmeasuredLegs === 1 ? 'has' : 'have'} no sourced distance, so the mileage and drive time shown are floors, not totals.`,
    })
  }

  const gain = high(itinerary.gainFt)
  if (gain !== null && gain > profile.maxGainFt) {
    warnings.push({
      level: 'caution',
      message: `Up to ${formatMeasure(itinerary.gainFt, 'ft')} of climbing, above the ${profile.maxGainFt.toLocaleString()} ft you set as your ceiling.`,
    })
  }

  const elevation = high(itinerary.maxElevationFt)
  if (elevation !== null && elevation > profile.maxElevationFt) {
    warnings.push({
      level: 'caution',
      message: `Tops out near ${formatMeasure(itinerary.maxElevationFt, 'ft')}, above the ${profile.maxElevationFt.toLocaleString()} ft you set as your ceiling.`,
    })
  }

  if (daylight) {
    const hikeLeg = itinerary.legs.find((l) => l.kind === 'hike')
    if (hikeLeg && hikeLeg.endMinutes > daylight.sunset) {
      warnings.push({
        level: 'caution',
        message: `The walking finishes at ${formatClock(hikeLeg.endMinutes)}, after sunset at ${formatClock(daylight.sunset)}. Headlamps, or start earlier.`,
      })
    }
    if (itinerary.departMinutes < daylight.sunrise - 60) {
      warnings.push({
        level: 'info',
        message: `You will be driving in the dark: sunrise is ${formatClock(daylight.sunrise)}. Deer and elk are on the highway at that hour.`,
      })
    }
  }

  if (itinerary.overnight && camp) {
    warnings.push({
      level: 'info',
      message: 'Camping legality is set by the signs at the site, not by this app. Check fire restrictions the day you go.',
    })
  }

  return warnings
}

/* ---------------------------------------------------------------- pickers */

function pickHike(
  adventure: Adventure,
  explicit: string | null | undefined,
  constraints: PlanConstraints,
): Hike | null {
  if (explicit === null) return null
  if (explicit) return HIKES_BY_ID[explicit] ?? null
  if (constraints.hikeAppetite === 'none') return null

  const candidates = adventure.hikeIds
    .map((id) => HIKES_BY_ID[id])
    .filter((h): h is Hike => Boolean(h))
  if (candidates.length === 0) return null

  const ceiling =
    constraints.hikeAppetite === 'short'
      ? 4
      : constraints.hikeAppetite === 'moderate'
        ? 8
        : Infinity

  const withinAppetite = candidates.filter(
    (h) => (mid(h.miles) ?? 0) <= ceiling,
  )
  return withinAppetite[0] ?? candidates[0]
}

function pickFood(
  adventure: Adventure,
  explicit: string | null | undefined,
  constraints: PlanConstraints,
): FoodStop | null {
  if (explicit === null) return null
  if (explicit) {
    const chosen = FOOD_BY_ID[explicit]
    return chosen && chosen.closed === null ? chosen : null
  }
  if (constraints.food === 'none') return null

  const candidates = adventure.foodIds
    .map((id) => FOOD_BY_ID[id])
    // A place we know has closed never gets recommended, whatever the mode.
    .filter((f): f is FoodStop => Boolean(f) && f.closed === null)

  if (constraints.food === 'brewery') {
    const beer = candidates.find(
      (f) => f.kind === 'brewery' || f.kind === 'brewpub',
    )
    if (beer) return beer
  }
  return candidates[0] ?? null
}

function pickCamp(
  adventure: Adventure,
  explicit: string | null | undefined,
): Camp | null {
  if (explicit === null) return null
  if (explicit) return CAMPS_BY_ID[explicit] ?? null
  const first = adventure.campIds.map((id) => CAMPS_BY_ID[id]).find(Boolean)
  return first ?? null
}

/* ----------------------------------------------------------------- detail */

function segmentTiming(segment: Adventure['outbound'][number]): {
  minutes: number
  sourced: boolean
} {
  if (segment.minutesOverride !== undefined && segment.minutesOverride !== null) {
    return { minutes: mid(segment.minutesOverride) ?? 0, sourced: true }
  }
  if (segment.miles === null) {
    // No sourced distance and no sourced time. We refuse to invent one; the
    // leg contributes zero minutes and is counted in `unmeasuredLegs`.
    return { minutes: 0, sourced: false }
  }
  const est = estimateDrive([segment])
  return { minutes: mid(est.minutes) ?? 0, sourced: false }
}

function driveDetail(segment: Adventure['outbound'][number]): string {
  const parts = [
    `${formatMeasure(segment.miles, 'mi', { decimals: 1 })} · ${ROAD_CLASS_LABEL[segment.roadClass]} · ${VEHICLE_LABEL[segment.vehicle]}`,
  ]
  if (segment.notes) parts.push(segment.notes)
  return parts.join(' — ')
}

function hikeDetail(hike: Hike, minutes: Measure): string {
  return [
    formatMeasure(hike.miles, 'mi', { decimals: 1 }),
    `${formatMeasure(hike.gainFt, 'ft')} gain`,
    `high point ${formatMeasure(hike.highPointFt, 'ft')}`,
    `about ${formatDurationRange(minutes)} moving and stopped`,
  ].join(' · ')
}

/** "6h 15m" or "6h 15m–7h 15m" — raw minutes are unreadable past an hour. */
export function formatDurationRange(minutes: Measure): string {
  if (minutes === null) return 'UNKNOWN'
  const lo = low(minutes) as number
  const hi = high(minutes) as number
  return lo === hi
    ? formatDuration(lo)
    : `${formatDuration(lo)}–${formatDuration(hi)}`
}

/** The way home, named in the order the roads are actually met. */
function returnDetail(segments: Adventure['outbound']): string {
  const names: string[] = []
  for (const segment of segments) {
    const name = shortRoad(segment.via)
    // Two legs of the same highway read as one road on the way home.
    if (names[names.length - 1] !== name) names.push(name)
  }
  const miles = sumMeasures(segments.map((s) => s.miles))
  const distance =
    miles.value === null
      ? 'distance UNKNOWN'
      : `${formatMeasure(miles.value, 'mi', { decimals: 1 })}${miles.missing > 0 ? '+' : ''}`
  return `Back the way you came: ${names.join(', then ')} \u00b7 ${distance}`
}

/**
 * Reduces an outbound leg name to the road itself.
 *
 * Two things matter here. The stored names are written for the drive out
 * ("US 550 north over Coal Bank"), and a compass bearing that is correct
 * outbound is wrong on the way home, so bearings are dropped rather than
 * reversed -- naming the road is enough. And a leg named "US 550 north 2 mi
 * from Silverton, then FR 585" is really the FR 585 leg, so the LAST road
 * designator wins, not the first.
 */
export function shortRoad(via: string): string {
  const routes = via.match(/\b(?:US|CO|CR|FR|FDR|I)[\s-]?\d+[A-Z]?\b/g)
  if (routes) return routes[routes.length - 1]

  const road = via.split(/,| to | toward | over | up | along /)[0]
  return road
    .replace(/\b(north|south|east|west|up|down)(bound)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function foodDetail(food: FoodStop): string {
  const bits = [food.town]
  if (food.address) bits.push(food.address)
  bits.push(food.hoursNote ?? 'Hours not verified — call ahead.')
  return bits.join(' · ')
}

function campDetail(camp: Camp): string {
  return [
    camp.kind === 'dispersed' ? 'Dispersed' : 'Developed campground',
    `${formatMeasure(camp.elevationFt, 'ft')}`,
    camp.rooftopTentNotes ?? '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function breakFractionFor(constraints: PlanConstraints): number {
  return constraints.hikeAppetite === 'long' ? 0.2 : 0.15
}

function stopBudgetFor(constraints: PlanConstraints, hasHike: boolean): number {
  const window = constraints.homeByMinutes - constraints.earliestDeparture
  const share = hasHike ? 0.15 : 0.45
  return Math.max(0, Math.round(window * share))
}

function addNullable(a: Measure, b: Measure): Measure {
  if (a === null) return b
  if (b === null) return a
  return addMeasures(a, b)
}

/** Total hiking + driving + stopping, for card summaries. */
export function committedMinutes(itinerary: Itinerary): number {
  return itinerary.totalMinutes
}

export { sumMeasures }
