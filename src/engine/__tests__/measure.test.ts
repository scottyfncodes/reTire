import { describe, expect, it } from 'vitest'
import {
  addMeasures,
  formatMeasure,
  high,
  low,
  maxMeasure,
  mid,
  normalize,
  roundMeasure,
  scaleMeasure,
  sumMeasures,
} from '../measure'

describe('unknown values', () => {
  it('never turns an unknown into a number', () => {
    expect(low(null)).toBeNull()
    expect(high(null)).toBeNull()
    expect(mid(null)).toBeNull()
    expect(addMeasures(null, 5)).toBeNull()
    expect(addMeasures(5, null)).toBeNull()
    expect(scaleMeasure(null, 2)).toBeNull()
    expect(roundMeasure(null)).toBeNull()
  })

  it('renders unknown as UNKNOWN, not as a blank or a zero', () => {
    expect(formatMeasure(null, 'mi')).toBe('UNKNOWN')
    expect(formatMeasure(null, 'mi', { unknown: 'ACCESS STATUS UNKNOWN' })).toBe(
      'ACCESS STATUS UNKNOWN',
    )
    expect(formatMeasure(0, 'mi')).toBe('0 mi')
  })
})

describe('ranges', () => {
  it('keeps a published spread rather than picking a flattering number', () => {
    const miles = { min: 7.4, max: 8.5 }
    expect(formatMeasure(miles, 'mi', { decimals: 1 })).toBe('7.4–8.5 mi')
    expect(low(miles)).toBe(7.4)
    expect(high(miles)).toBe(8.5)
    expect(mid(miles)).toBeCloseTo(7.95)
  })

  it('collapses a degenerate range back to a single number', () => {
    expect(normalize({ min: 5, max: 5 })).toBe(5)
  })

  it('repairs an inverted range instead of producing nonsense', () => {
    expect(normalize({ min: 9, max: 2 })).toEqual({ min: 2, max: 9 })
  })

  it('adds ranges end to end', () => {
    expect(addMeasures({ min: 1, max: 2 }, { min: 3, max: 4 })).toEqual({
      min: 4,
      max: 6,
    })
    expect(addMeasures({ min: 1, max: 2 }, 3)).toEqual({ min: 4, max: 5 })
  })

  it('scales a range without flipping it when the factor is negative', () => {
    expect(scaleMeasure({ min: 2, max: 4 }, -1)).toEqual({ min: -4, max: -2 })
  })
})

describe('summing partly-unknown data', () => {
  it('reports a floor plus a count instead of treating unknown as zero', () => {
    const result = sumMeasures([48, null, 6.4])
    expect(result.value).toBe(54.4)
    expect(result.missing).toBe(1)
  })

  it('returns null when nothing at all was known', () => {
    expect(sumMeasures([null, null])).toEqual({ value: null, missing: 2 })
  })

  it('handles an empty list', () => {
    expect(sumMeasures([])).toEqual({ value: null, missing: 0 })
  })

  it('picks the largest known value and ignores unknowns', () => {
    expect(maxMeasure([null, 12100, { min: 9000, max: 12800 }])).toEqual({
      min: 9000,
      max: 12800,
    })
    expect(maxMeasure([null, null])).toBeNull()
  })
})
