import { describe, expect, it } from 'vitest'
import { describeCode, findDay, parseForecast, weatherNotes } from './weather'

const OK_BODY = {
  daily: {
    time: ['2026-07-15', '2026-07-16'],
    temperature_2m_max: [71.2, 64.0],
    temperature_2m_min: [44.1, 39.5],
    precipitation_sum: [0.02, 0.4],
    precipitation_probability_max: [20, 75],
    snowfall_sum: [0, 0],
    wind_speed_10m_max: [11, 26],
    wind_gusts_10m_max: [19, 38],
    sunrise: ['2026-07-15T05:58', '2026-07-16T05:59'],
    sunset: ['2026-07-15T20:29', '2026-07-16T20:28'],
    weather_code: [1, 95],
  },
}

describe('forecast parsing', () => {
  it('reads a well-formed response', () => {
    const result = parseForecast(OK_BODY, 37.8, -107.77, 12400)
    expect(result.daily).toHaveLength(2)
    expect(result.daily[0].tempMaxF).toBe(71.2)
    expect(result.daily[0].sunrise).toBe(5 * 60 + 58)
    expect(result.daily[0].sunset).toBe(20 * 60 + 29)
    expect(result.elevationFt).toBe(12400)
  })

  it('returns an empty forecast rather than throwing on a broken body', () => {
    expect(parseForecast({}, 0, 0, null).daily).toEqual([])
    expect(parseForecast(null, 0, 0, null).daily).toEqual([])
    expect(parseForecast('nonsense', 0, 0, null).daily).toEqual([])
    expect(parseForecast({ daily: {} }, 0, 0, null).daily).toEqual([])
  })

  it('turns missing and non-numeric fields into null, not zero', () => {
    const patchy = parseForecast(
      {
        daily: {
          time: ['2026-07-15'],
          temperature_2m_max: [null],
          wind_gusts_10m_max: ['windy'],
          sunrise: [undefined],
        },
      },
      0,
      0,
      null,
    )
    expect(patchy.daily[0].tempMaxF).toBeNull()
    expect(patchy.daily[0].gustMaxMph).toBeNull()
    expect(patchy.daily[0].sunrise).toBeNull()
    expect(patchy.daily[0].precipInches).toBeNull()
  })

  it('does not mistake a malformed timestamp for midnight', () => {
    const odd = parseForecast(
      { daily: { time: ['2026-07-15'], sunrise: ['not a time'] } },
      0,
      0,
      null,
    )
    expect(odd.daily[0].sunrise).toBeNull()
  })
})

describe('finding the right day', () => {
  it('matches by ISO date', () => {
    const result = parseForecast(OK_BODY, 0, 0, null)
    expect(findDay(result, '2026-07-16')?.tempMaxF).toBe(64.0)
  })

  it('returns null for a date outside the forecast window', () => {
    const result = parseForecast(OK_BODY, 0, 0, null)
    expect(findDay(result, '2026-12-25')).toBeNull()
    expect(findDay(null, '2026-07-15')).toBeNull()
  })
})

describe('weather codes', () => {
  it('describes the common ones and admits to the rest', () => {
    expect(describeCode(0)).toBe('Clear')
    expect(describeCode(3)).toBe('Overcast')
    expect(describeCode(71)).toBe('Snow')
    expect(describeCode(95)).toBe('Thunderstorms')
    expect(describeCode(null)).toBe('UNKNOWN')
    expect(describeCode(1234)).toBe('UNKNOWN')
  })
})

describe('weather notes', () => {
  it('reports observations rather than a verdict', () => {
    const result = parseForecast(OK_BODY, 0, 0, 12400)
    const notes = weatherNotes(findDay(result, '2026-07-16'), 12400)
    expect(notes.join(' ')).toContain('75% chance')
    expect(notes.join(' ')).toContain('gusts to 38 mph')
    expect(notes.join(' ')).toContain('Thunderstorms forecast')
    expect(notes.join(' ')).not.toMatch(/perfect|ideal/i)
  })

  it('stays quiet about a benign day', () => {
    const result = parseForecast(OK_BODY, 0, 0, null)
    const notes = weatherNotes(findDay(result, '2026-07-15'), null)
    expect(notes.join(' ')).not.toContain('gusts')
    expect(notes.join(' ')).toContain('71° / 44°F')
  })

  it('says the forecast is unavailable rather than inventing one', () => {
    expect(weatherNotes(null, null)).toEqual(['Forecast unavailable.'])
  })

  it('flags that a high-elevation forecast was elevation-corrected', () => {
    const result = parseForecast(OK_BODY, 0, 0, 12400)
    expect(weatherNotes(findDay(result, '2026-07-15'), 12400).join(' ')).toContain(
      'elevation-corrected',
    )
  })
})
