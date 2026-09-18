import type { Measure, MeasureRange } from '../data/types'

export function isRange(m: Measure): m is MeasureRange {
  return m !== null && typeof m === 'object'
}

export function isKnown(m: Measure): m is number | MeasureRange {
  return m !== null
}

/** Lower bound of a measure. Unknown has no lower bound. */
export function low(m: Measure): number | null {
  if (m === null) return null
  return isRange(m) ? m.min : m
}

/** Upper bound of a measure. */
export function high(m: Measure): number | null {
  if (m === null) return null
  return isRange(m) ? m.max : m
}

/** Midpoint, used only where a single number is unavoidable. */
export function mid(m: Measure): number | null {
  if (m === null) return null
  return isRange(m) ? (m.min + m.max) / 2 : m
}

/** Collapse a range back to a plain number when both ends agree. */
export function normalize(m: Measure): Measure {
  if (isRange(m)) {
    if (m.min === m.max) return m.min
    if (m.min > m.max) return { min: m.max, max: m.min }
  }
  return m
}

export function addMeasures(a: Measure, b: Measure): Measure {
  if (a === null || b === null) return null
  const lo = (low(a) as number) + (low(b) as number)
  const hi = (high(a) as number) + (high(b) as number)
  return normalize({ min: lo, max: hi })
}

export function scaleMeasure(m: Measure, factor: number): Measure {
  if (m === null) return null
  if (isRange(m)) {
    const a = m.min * factor
    const b = m.max * factor
    return normalize(a <= b ? { min: a, max: b } : { min: b, max: a })
  }
  return m * factor
}

export function roundMeasure(m: Measure, step = 1): Measure {
  if (m === null) return null
  const r = (n: number) => Math.round(n / step) * step
  return isRange(m) ? normalize({ min: r(m.min), max: r(m.max) }) : r(m)
}

export interface MeasureSum {
  /** Sum of the known parts. Null only when nothing at all was known. */
  value: Measure
  /** How many inputs were UNKNOWN. Above zero means `value` is a floor. */
  missing: number
}

/**
 * Sums a list that may contain unknowns without pretending they were zero.
 * Callers get a floor plus a count, so the UI can say "at least X, 1 leg
 * unmeasured" instead of quietly under-reporting.
 */
export function sumMeasures(items: Measure[]): MeasureSum {
  let value: Measure = null
  let missing = 0
  for (const item of items) {
    if (item === null) {
      missing += 1
      continue
    }
    value = value === null ? normalize(item) : addMeasures(value, item)
  }
  return { value, missing }
}

/** The largest known value in a list; null when none are known. */
export function maxMeasure(items: Measure[]): Measure {
  let best: Measure = null
  for (const item of items) {
    if (item === null) continue
    if (best === null || (high(item) as number) > (high(best) as number)) {
      best = item
    }
  }
  return best
}

const FMT = new Intl.NumberFormat('en-US')

export function formatMeasure(
  m: Measure,
  unit = '',
  opts: { decimals?: number; unknown?: string } = {},
): string {
  const { decimals = 0, unknown = 'UNKNOWN' } = opts
  if (m === null) return unknown
  const f = (n: number) =>
    decimals > 0
      ? n.toFixed(decimals).replace(/\.0+$/, '')
      : FMT.format(Math.round(n))
  const body = isRange(m) ? `${f(m.min)}–${f(m.max)}` : f(m)
  return unit ? `${body} ${unit}` : body
}
