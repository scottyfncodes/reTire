import { describe, expect, it } from 'vitest'
import { altitudeFactor, estimateHike } from '../hike'
import { high, low, mid } from '../measure'

describe('altitude factor', () => {
  it('is neutral below the threshold', () => {
    expect(altitudeFactor(8000)).toBe(1)
    expect(altitudeFactor(10000)).toBe(1)
  })

  it('costs time above 10,000 ft', () => {
    expect(altitudeFactor(12000)).toBeCloseTo(1.16)
    expect(altitudeFactor(13000)).toBeCloseTo(1.24)
  })

  it('uses the top of a range, and is neutral when unknown', () => {
    expect(altitudeFactor({ min: 9000, max: 12000 })).toBeCloseTo(1.16)
    expect(altitudeFactor(null)).toBe(1)
  })
})

describe('hike duration', () => {
  it('combines distance, climbing and thin air', () => {
    // 7 mi at 2.2 mph = 190.9 min, +2,400 ft = +72 min, x1.192 for 12,400 ft
    const estimate = estimateHike(
      { miles: 7, gainFt: 2400, highPointFt: 12400 },
      2.2,
      0,
    )
    expect(mid(estimate.minutes)).toBeCloseTo(315, -1)
    expect(estimate.factor).toBeCloseTo(1.192)
  })

  it('adds a break allowance on top of moving time', () => {
    const estimate = estimateHike(
      { miles: 6, gainFt: 1000, highPointFt: 9000 },
      2.2,
      0.15,
    )
    const moving = mid(estimate.minutes) as number
    const withBreaks = mid(estimate.minutesWithBreaks) as number
    expect(withBreaks).toBeGreaterThan(moving)
    expect(withBreaks / moving).toBeCloseTo(1.15, 1)
  })

  it('takes longer for a slower walker', () => {
    const input = { miles: 8, gainFt: 2000, highPointFt: 11000 }
    const brisk = mid(estimateHike(input, 3).minutes) as number
    const steady = mid(estimateHike(input, 1.8).minutes) as number
    expect(steady).toBeGreaterThan(brisk)
  })

  it('carries a distance range straight through to a time range', () => {
    const estimate = estimateHike(
      { miles: { min: 7.4, max: 8.5 }, gainFt: 2400, highPointFt: 12400 },
      2.2,
      0,
    )
    expect(low(estimate.minutes) as number).toBeLessThan(
      high(estimate.minutes) as number,
    )
  })

  it('returns unknown when distance is unknown', () => {
    const estimate = estimateHike(
      { miles: null, gainFt: 2400, highPointFt: 12400 },
      2.2,
    )
    expect(estimate.minutes).toBeNull()
    expect(estimate.minutesWithBreaks).toBeNull()
  })

  it('treats unknown gain as no added climbing time rather than crashing', () => {
    const estimate = estimateHike(
      { miles: 5, gainFt: null, highPointFt: 9000 },
      2.2,
      0,
    )
    expect(mid(estimate.minutes)).toBeCloseTo(135, -1)
  })

  it('refuses a nonsensical pace instead of dividing by zero', () => {
    expect(() =>
      estimateHike({ miles: 5, gainFt: 100, highPointFt: 9000 }, 0),
    ).toThrow()
  })
})
