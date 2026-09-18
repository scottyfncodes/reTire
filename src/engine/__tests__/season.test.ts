import { describe, expect, it } from 'vitest'
import type { SeasonWindow } from '../../data/types'
import {
  formatSeasonMonths,
  monthOf,
  seasonVerdict,
  seasonWarnings,
} from '../season'

const window = (months: number[] | null): SeasonWindow => ({
  months,
  note: 'Test note.',
  confidence: months ? 'reported' : 'unknown',
  sources: ['test'],
  lastChecked: '2026-09-18',
})

describe('month parsing', () => {
  it('reads the month without timezone drift', () => {
    expect(monthOf('2026-01-01')).toBe(1)
    expect(monthOf('2026-12-31')).toBe(12)
  })

  it('rejects anything that is not an ISO date', () => {
    expect(() => monthOf('7/15/2026')).toThrow()
    expect(() => monthOf('2026-13-01')).toThrow()
    expect(() => monthOf('')).toThrow()
  })
})

describe('season verdicts', () => {
  const highCountry = window([7, 8, 9])

  it('is in season inside the window', () => {
    expect(seasonVerdict(highCountry, '2026-08-01')).toBe('in_season')
  })

  it('calls the month either side a shoulder', () => {
    expect(seasonVerdict(highCountry, '2026-06-20')).toBe('shoulder')
    expect(seasonVerdict(highCountry, '2026-10-05')).toBe('shoulder')
  })

  it('is out of season well away from the window', () => {
    expect(seasonVerdict(highCountry, '2026-01-15')).toBe('out_of_season')
  })

  it('wraps December to January when a window spans the new year', () => {
    const winter = window([12, 1, 2])
    expect(seasonVerdict(winter, '2026-11-15')).toBe('shoulder')
    expect(seasonVerdict(winter, '2026-03-15')).toBe('shoulder')
  })

  it('says unknown rather than guessing when no window is recorded', () => {
    expect(seasonVerdict(window(null), '2026-08-01')).toBe('unknown')
    expect(seasonVerdict(window([]), '2026-08-01')).toBe('unknown')
  })
})

describe('season warnings', () => {
  it('blocks out of season and cautions on the shoulder', () => {
    const highCountry = window([7, 8, 9])
    expect(seasonWarnings(highCountry, '2026-01-15', 'Ice Lake')[0].level).toBe(
      'blocker',
    )
    expect(seasonWarnings(highCountry, '2026-06-15', 'Ice Lake')[0].level).toBe(
      'caution',
    )
    expect(seasonWarnings(highCountry, '2026-08-15', 'Ice Lake')).toEqual([])
  })

  it('says UNKNOWN out loud rather than staying quiet', () => {
    const warnings = seasonWarnings(window(null), '2026-08-01', 'Some road')
    expect(warnings[0].message).toContain('SEASONAL ACCESS UNKNOWN')
  })
})

describe('season formatting', () => {
  it('collapses consecutive months into a range', () => {
    expect(formatSeasonMonths(window([7, 8, 9]))).toBe('Jul–Sep')
  })

  it('keeps gaps visible', () => {
    expect(formatSeasonMonths(window([4, 5, 9, 10]))).toBe('Apr–May, Sep–Oct')
  })

  it('handles a single month and an unknown window', () => {
    expect(formatSeasonMonths(window([7]))).toBe('Jul')
    expect(formatSeasonMonths(window(null))).toBe('UNKNOWN')
  })
})
