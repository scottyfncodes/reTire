import type { Hike, Measure } from '../data/types'
import { high, low, mid, normalize, scaleMeasure } from './measure'

/**
 * Hiking time model.
 *
 * Base is the walker's own flat-ground pace, plus a Naismith-style penalty for
 * climbing, plus a thin-air factor above 10,000 ft. It is a model and the UI
 * says so -- but it is a model tuned for the terrain this app covers, where
 * half the days start higher than most people's hardest hike.
 */
export const DEFAULT_PACE_MPH = 2.2

/** Minutes added per 1,000 ft of ascent. */
export const CLIMB_MINUTES_PER_1000FT = 30

/** Where thin air starts to cost measurable time. */
export const ALTITUDE_THRESHOLD_FT = 10000

/** Slowdown per 1,000 ft above the threshold. */
export const ALTITUDE_PENALTY_PER_1000FT = 0.08

export function altitudeFactor(highPointFt: Measure): number {
  const peak = high(highPointFt)
  if (peak === null || peak <= ALTITUDE_THRESHOLD_FT) return 1
  const above = (peak - ALTITUDE_THRESHOLD_FT) / 1000
  return 1 + above * ALTITUDE_PENALTY_PER_1000FT
}

export interface HikeEstimate {
  /** Moving time in minutes. Null when distance is unknown. */
  minutes: Measure
  /** Moving time plus a break allowance. */
  minutesWithBreaks: Measure
  factor: number
}

/**
 * @param paceMph flat-ground pace from the user's profile
 * @param breakFraction share of moving time spent stopped (lunch, photos, lakes)
 */
export function estimateHike(
  hike: Pick<Hike, 'miles' | 'gainFt' | 'highPointFt'>,
  paceMph: number = DEFAULT_PACE_MPH,
  breakFraction = 0.15,
): HikeEstimate {
  const factor = altitudeFactor(hike.highPointFt)

  if (hike.miles === null) {
    return { minutes: null, minutesWithBreaks: null, factor }
  }
  if (paceMph <= 0) {
    throw new Error('Hiking pace must be greater than zero')
  }

  const flatMinutes = scaleMeasure(hike.miles, 60 / paceMph)
  const climbMinutes =
    hike.gainFt === null
      ? 0
      : scaleMeasure(hike.gainFt, CLIMB_MINUTES_PER_1000FT / 1000)

  const combined = addLoose(flatMinutes, climbMinutes)
  const minutes = scaleMeasure(combined, factor)
  const minutesWithBreaks = scaleMeasure(minutes, 1 + breakFraction)

  return {
    minutes: roundFive(minutes),
    minutesWithBreaks: roundFive(minutesWithBreaks),
    factor,
  }
}

function addLoose(a: Measure, b: Measure | 0): Measure {
  if (a === null) return null
  if (b === 0 || b === null) return a
  const lo = (low(a) as number) + (low(b) as number)
  const hi = (high(a) as number) + (high(b) as number)
  return normalize({ min: lo, max: hi })
}

function roundFive(m: Measure): Measure {
  if (m === null) return null
  const r = (n: number) => Math.round(n / 5) * 5
  if (typeof m === 'number') return r(m)
  return normalize({ min: r(m.min), max: r(m.max) })
}

/**
 * A single headline number for sorting and for the summary line. Uses the
 * midpoint of a range, because a range cannot be sorted.
 */
export function headlineMinutes(estimate: HikeEstimate): number {
  return mid(estimate.minutesWithBreaks) ?? 0
}
