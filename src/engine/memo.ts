import type { Adventure, Itinerary } from '../data/types'
import { FOOD_BY_ID } from '../data/food'
import { HIKES_BY_ID } from '../data/hikes'
import { STOPS_BY_ID } from '../data/stops'
import { formatMeasure } from './measure'
import { formatClock, formatDuration } from './time'
import { VEHICLE_LABEL } from './drive'

export interface MemoLine {
  heading: string
  body: string[]
}

/**
 * The finance-guy presentation layer. It is a different way of reading the
 * same plan, not a different plan -- every figure here comes straight off the
 * itinerary, UNKNOWNs included.
 */
export function buildMemo(
  adventure: Adventure,
  itinerary: Itinerary,
): MemoLine[] {
  const hike = itinerary.hikeId ? HIKES_BY_ID[itinerary.hikeId] : null
  const food = itinerary.foodId ? FOOD_BY_ID[itinerary.foodId] : null
  const upside = adventure.stopIds
    .map((id) => STOPS_BY_ID[id])
    .filter(Boolean)
    .slice(0, 2)

  const lines: MemoLine[] = [
    { heading: 'The play', body: [adventure.tagline, adventure.why] },
    {
      heading: 'Objective',
      body: [adventure.highlights[0] ?? adventure.tagline],
    },
    {
      heading: 'Entry cost',
      body: [
        `${formatDuration(itinerary.driveMinutes)} behind the wheel${itinerary.unmeasuredLegs > 0 ? ' (floor — some legs unmeasured)' : ''}.`,
        `${formatMeasure(itinerary.driveMiles, 'mi', { decimals: 0 })} on the odometer.`,
        `Road calls for: ${VEHICLE_LABEL[itinerary.vehicle]}.`,
      ],
    },
  ]

  lines.push({
    heading: 'Capital commitment',
    body: hike
      ? [
          `${formatMeasure(hike.miles, 'mi', { decimals: 1 })} on foot, ${formatMeasure(hike.gainFt, 'ft')} of gain.`,
          `High point ${formatMeasure(hike.highPointFt, 'ft')}.`,
          `${formatDuration(itinerary.hikeMinutes)} moving and stopped.`,
        ]
      : ['No hiking leg. This one is bought with driving time.'],
  })

  const risks = [
    ...adventure.hazards,
    ...itinerary.warnings
      .filter((w) => w.level !== 'info')
      .map((w) => w.message),
  ]
  lines.push({
    heading: 'Risk factors',
    body: risks.length > 0 ? risks : ['Nothing flagged beyond ordinary mountain weather.'],
  })

  if (upside.length > 0) {
    lines.push({
      heading: 'Optional upside',
      body: upside.map((s) => `${s.name} — ${s.blurb}`),
    })
  }

  lines.push({
    heading: 'Exit strategy',
    body: itinerary.overnight
      ? ['Camp on site; the return leg is tomorrow’s problem.']
      : [
          `Home by ${formatClock(itinerary.homeMinutes)}.`,
          adventure.returnVia ? 'Different route home.' : 'Retrace the outbound.',
        ],
  })

  lines.push({
    heading: 'Post-close',
    body: food
      ? [`${food.name}, ${food.town}.`, food.hoursNote ?? 'Hours not verified — call ahead.']
      : ['No food or beer leg on this plan.'],
  })

  return lines
}
