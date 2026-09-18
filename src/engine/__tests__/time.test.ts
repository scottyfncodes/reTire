import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, parseClock, spillsPastMidnight } from '../time'

describe('clock parsing', () => {
  it('reads HH:MM into minutes after midnight', () => {
    expect(parseClock('00:00')).toBe(0)
    expect(parseClock('7:15')).toBe(435)
    expect(parseClock('18:30')).toBe(1110)
    expect(parseClock('23:59')).toBe(1439)
  })

  it('rejects malformed and out-of-range input rather than guessing', () => {
    expect(() => parseClock('')).toThrow()
    expect(() => parseClock('7')).toThrow()
    expect(() => parseClock('7:5')).toThrow()
    expect(() => parseClock('24:00')).toThrow()
    expect(() => parseClock('12:60')).toThrow()
    expect(() => parseClock('abc')).toThrow()
  })
})

describe('clock formatting', () => {
  it('uses 12-hour time the way the cards read', () => {
    expect(formatClock(0)).toBe('12:00 AM')
    expect(formatClock(435)).toBe('7:15 AM')
    expect(formatClock(720)).toBe('12:00 PM')
    expect(formatClock(1110)).toBe('6:30 PM')
  })

  it('wraps past midnight instead of printing 25:00', () => {
    expect(formatClock(1440)).toBe('12:00 AM')
    expect(formatClock(1500)).toBe('1:00 AM')
    expect(formatClock(-60)).toBe('11:00 PM')
  })
})

describe('durations', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(125)).toBe('2h 05m')
    expect(formatDuration(600)).toBe('10h 00m')
  })

  it('never returns a negative duration', () => {
    expect(formatDuration(-30)).toBe('0m')
  })

  it('flags a plan that runs into tomorrow', () => {
    expect(spillsPastMidnight(1439)).toBe(false)
    expect(spillsPastMidnight(1440)).toBe(true)
  })
})
