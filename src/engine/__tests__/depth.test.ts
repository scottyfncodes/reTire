import { describe, expect, it } from 'vitest'
import { classifyDepth, depthAtLeast } from '../depth'

const base = {
  totalMinutes: 120,
  hikeMiles: null,
  gainFt: null,
  maxElevationFt: null,
  overnight: false,
  technicalDriving: false,
}

describe('adventure depth', () => {
  it('calls a short outing a quick outing', () => {
    expect(classifyDepth({ ...base, totalMinutes: 110 })).toBe('quick_outing')
  })

  it('steps up with time on the clock', () => {
    expect(classifyDepth({ ...base, totalMinutes: 240 })).toBe('half_day')
    expect(classifyDepth({ ...base, totalMinutes: 450 })).toBe('full_day')
    expect(classifyDepth({ ...base, totalMinutes: 620 })).toBe('big_day')
  })

  it('steps up on hiking distance even in a short day', () => {
    expect(classifyDepth({ ...base, totalMinutes: 200, hikeMiles: 9.5 })).toBe(
      'big_day',
    )
  })

  it('steps up on climbing even at modest distance', () => {
    expect(classifyDepth({ ...base, totalMinutes: 200, gainFt: 2600 })).toBe(
      'big_day',
    )
  })

  it('treats high altitude plus real distance as a big day', () => {
    expect(
      classifyDepth({
        ...base,
        totalMinutes: 300,
        hikeMiles: 6,
        maxElevationFt: 12700,
      }),
    ).toBe('big_day')
  })

  it('counts a long technical driving day as a big day', () => {
    expect(
      classifyDepth({ ...base, totalMinutes: 500, technicalDriving: true }),
    ).toBe('big_day')
  })

  it('an overnighter is always an expedition', () => {
    expect(classifyDepth({ ...base, totalMinutes: 60, overnight: true })).toBe(
      'expedition',
    )
  })

  it('uses the top of a range, not the flattering end', () => {
    expect(
      classifyDepth({ ...base, totalMinutes: 200, hikeMiles: { min: 4, max: 10 } }),
    ).toBe('big_day')
  })

  it('does not fall over when everything is unknown', () => {
    expect(classifyDepth(base)).toBe('quick_outing')
  })

  it('orders depths so a filter can ask for "at least"', () => {
    expect(depthAtLeast('big_day', 'full_day')).toBe(true)
    expect(depthAtLeast('half_day', 'big_day')).toBe(false)
    expect(depthAtLeast('expedition', 'expedition')).toBe(true)
  })
})
