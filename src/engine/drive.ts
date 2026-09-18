import type {
  DriveSegment,
  Measure,
  RoadClass,
  VehicleRequirement,
} from '../data/types'
import { addMeasures, high, low, normalize, scaleMeasure, sumMeasures } from './measure'

/**
 * Average speeds by road class, mph.
 *
 * These are a disclosed model, not measurements. The app labels every duration
 * derived from them as an estimate, and a sourced `minutesOverride` on a
 * segment always wins.
 */
export const ROAD_SPEED_MPH: Record<RoadClass, number> = {
  paved_highway: 55,
  paved_mountain: 40,
  graded_dirt: 22,
  rough_dirt: 14,
  high_clearance: 10,
  technical_4wd: 6,
}

export const ROAD_CLASS_LABEL: Record<RoadClass, string> = {
  paved_highway: 'Paved highway',
  paved_mountain: 'Paved mountain road',
  graded_dirt: 'Graded dirt / gravel',
  rough_dirt: 'Rough dirt',
  high_clearance: 'High-clearance road',
  technical_4wd: 'Technical 4WD',
}

export const VEHICLE_LABEL: Record<VehicleRequirement, string> = {
  any_vehicle: 'Any vehicle',
  high_clearance: 'High clearance',
  four_wd: '4WD',
  four_wd_low_range: '4WD with low range',
  unknown: 'ACCESS STATUS UNKNOWN',
}

const VEHICLE_RANK: Record<VehicleRequirement, number> = {
  any_vehicle: 0,
  high_clearance: 1,
  four_wd: 2,
  four_wd_low_range: 3,
  // Unknown sits above "any vehicle" on purpose: an unverified road is a
  // reason for caution, not a reason to assume the family sedan will do.
  unknown: 1.5 as number,
}

/** The hardest requirement across a set of segments. */
export function hardestVehicle(
  requirements: VehicleRequirement[],
): VehicleRequirement {
  if (requirements.length === 0) return 'any_vehicle'
  return requirements.reduce((worst, r) =>
    VEHICLE_RANK[r] > VEHICLE_RANK[worst] ? r : worst,
  )
}

export function meetsVehicle(
  have: VehicleRequirement,
  need: VehicleRequirement,
): boolean {
  if (need === 'unknown') return false
  return VEHICLE_RANK[have] >= VEHICLE_RANK[need]
}

export interface DriveEstimate {
  /** Minutes. Null when nothing in the leg set could be estimated at all. */
  minutes: Measure
  miles: Measure
  /** Legs whose length and duration were both unknown. */
  unmeasuredLegs: number
  /** False when at least one leg used our speed model rather than a source. */
  fullySourced: boolean
  vehicle: VehicleRequirement
}

/** Minutes for one segment: a published time if there is one, else the model. */
export function segmentMinutes(segment: DriveSegment): {
  minutes: Measure
  sourced: boolean
} {
  if (segment.minutesOverride !== undefined && segment.minutesOverride !== null) {
    return { minutes: normalize(segment.minutesOverride), sourced: true }
  }
  if (segment.miles === null) return { minutes: null, sourced: false }
  const speed = ROAD_SPEED_MPH[segment.roadClass]
  return { minutes: scaleMeasure(segment.miles, 60 / speed), sourced: false }
}

export function estimateDrive(segments: DriveSegment[]): DriveEstimate {
  const minuteParts: Measure[] = []
  let unmeasuredLegs = 0
  let fullySourced = true

  for (const segment of segments) {
    const { minutes, sourced } = segmentMinutes(segment)
    if (!sourced) fullySourced = false
    if (minutes === null) {
      unmeasuredLegs += 1
      continue
    }
    minuteParts.push(minutes)
  }

  const minuteSum = sumMeasures(minuteParts)
  const mileSum = sumMeasures(segments.map((s) => s.miles))

  return {
    minutes: minuteSum.value,
    miles: mileSum.value,
    unmeasuredLegs,
    fullySourced: fullySourced && unmeasuredLegs === 0,
    vehicle: hardestVehicle(segments.map((s) => s.vehicle)),
  }
}

/** Round trip: out and back over the same ground unless a return is given. */
export function estimateRoundTrip(
  outbound: DriveSegment[],
  returnVia?: DriveSegment[],
): DriveEstimate {
  const out = estimateDrive(outbound)
  const back = estimateDrive(returnVia ?? outbound)
  return {
    minutes: addKeepingFloor(out.minutes, back.minutes),
    miles: addKeepingFloor(out.miles, back.miles),
    unmeasuredLegs: out.unmeasuredLegs + back.unmeasuredLegs,
    fullySourced: out.fullySourced && back.fullySourced,
    vehicle: hardestVehicle([out.vehicle, back.vehicle]),
  }
}

/** Adds two measures treating a null side as "adds nothing known". */
function addKeepingFloor(a: Measure, b: Measure): Measure {
  if (a === null) return b
  if (b === null) return a
  return addMeasures(a, b)
}

/** Worst-case minutes, used for "will we make it home" checks. */
export function worstCaseMinutes(m: Measure): number {
  return high(m) ?? 0
}

/** Best-case minutes, used when showing a floor. */
export function bestCaseMinutes(m: Measure): number {
  return low(m) ?? 0
}
