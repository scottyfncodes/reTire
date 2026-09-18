import type { AdventureDepth, Measure } from '../data/types'
import { high } from './measure'

export const DEPTH_LABEL: Record<AdventureDepth, string> = {
  quick_outing: 'QUICK OUTING',
  half_day: 'HALF DAY',
  full_day: 'FULL DAY',
  big_day: 'BIG DAY',
  expedition: 'EXPEDITION',
}

export const DEPTH_BLURB: Record<AdventureDepth, string> = {
  quick_outing: 'Around two hours. Minimal commitment.',
  half_day: 'A real adventure that leaves the rest of the day intact.',
  full_day: 'Substantial driving, exploring and walking. The day is spoken for.',
  big_day: 'Long, demanding or high-consequence. Start early, mean it.',
  expedition: 'Overnight, or unusually involved.',
}

export const DEPTH_ORDER: AdventureDepth[] = [
  'quick_outing',
  'half_day',
  'full_day',
  'big_day',
  'expedition',
]

export interface DepthInput {
  totalMinutes: number
  hikeMiles: Measure
  gainFt: Measure
  maxElevationFt: Measure
  overnight: boolean
  /** Hardest road on the route needs low range. */
  technicalDriving: boolean
}

/**
 * The label summarises; the numbers explain. This deliberately does not read
 * "beginner / advanced" -- it describes what the day costs, and the user
 * decides whether that suits them.
 */
export function classifyDepth(input: DepthInput): AdventureDepth {
  if (input.overnight) return 'expedition'

  const hours = input.totalMinutes / 60
  const miles = high(input.hikeMiles) ?? 0
  const gain = high(input.gainFt) ?? 0
  const elevation = high(input.maxElevationFt) ?? 0

  const bigDay =
    hours >= 10 ||
    miles >= 9 ||
    gain >= 2500 ||
    (elevation >= 12500 && miles >= 5) ||
    (input.technicalDriving && hours >= 8)

  if (bigDay) return 'big_day'
  if (hours >= 7 || miles >= 6 || gain >= 1500) return 'full_day'
  if (hours >= 3.5 || miles >= 2.5) return 'half_day'
  return 'quick_outing'
}

export function depthAtLeast(
  depth: AdventureDepth,
  floor: AdventureDepth,
): boolean {
  return DEPTH_ORDER.indexOf(depth) >= DEPTH_ORDER.indexOf(floor)
}
