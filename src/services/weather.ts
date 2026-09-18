import { readJson, writeJson } from './storage'

/**
 * Weather comes from Open-Meteo: no API key, CORS-friendly, and it accepts an
 * elevation so a forecast for a 12,000 ft basin is not silently the forecast
 * for the valley floor.
 *
 * Every response is cached. When the network is gone we serve the cached copy
 * and say how old it is, rather than showing nothing or -- worse -- showing
 * something made up.
 */
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CACHE_TTL_MS = 30 * 60 * 1000

export interface DailyWeather {
  date: string
  tempMaxF: number | null
  tempMinF: number | null
  precipInches: number | null
  precipChance: number | null
  snowfallInches: number | null
  windMaxMph: number | null
  gustMaxMph: number | null
  /** Minutes after midnight, local. */
  sunrise: number | null
  sunset: number | null
  code: number | null
}

export interface WeatherResult {
  latitude: number
  longitude: number
  elevationFt: number | null
  daily: DailyWeather[]
  fetchedAt: number
  /** True when this came from cache because the network was unavailable. */
  stale: boolean
}

function cacheKey(lat: number, lon: number, elevationFt: number | null): string {
  return `weather.${lat.toFixed(3)},${lon.toFixed(3)},${elevationFt ?? 'auto'}`
}

function minutesFromIso(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /T(\d{2}):(\d{2})/.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function fetchWeather(
  lat: number,
  lon: number,
  elevationFt: number | null = null,
  signal?: AbortSignal,
): Promise<WeatherResult> {
  const key = cacheKey(lat, lon, elevationFt)
  const cached = readJson<WeatherResult | null>(key, null)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, stale: false }
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'snowfall_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'sunrise',
      'sunset',
      'weather_code',
    ].join(','),
    timezone: 'America/Denver',
    forecast_days: '7',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
  })
  if (elevationFt !== null) {
    params.set('elevation', String(Math.round(elevationFt / 3.28084)))
  }

  try {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, { signal })
    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`)
    const body = await response.json()
    const result = parseForecast(body, lat, lon, elevationFt)
    writeJson(key, result)
    return result
  } catch (error) {
    if (cached) return { ...cached, stale: true }
    throw error
  }
}

export function parseForecast(
  body: unknown,
  lat: number,
  lon: number,
  elevationFt: number | null,
): WeatherResult {
  const daily = (body as { daily?: Record<string, unknown[]> })?.daily
  const dates = (daily?.time as string[] | undefined) ?? []

  const series = (name: string): unknown[] =>
    (daily?.[name] as unknown[] | undefined) ?? []

  const max = series('temperature_2m_max')
  const min = series('temperature_2m_min')
  const precip = series('precipitation_sum')
  const chance = series('precipitation_probability_max')
  const snow = series('snowfall_sum')
  const wind = series('wind_speed_10m_max')
  const gust = series('wind_gusts_10m_max')
  const sunrise = series('sunrise')
  const sunset = series('sunset')
  const code = series('weather_code')

  return {
    latitude: lat,
    longitude: lon,
    elevationFt,
    fetchedAt: Date.now(),
    stale: false,
    daily: dates.map((date, i) => ({
      date,
      tempMaxF: num(max[i]),
      tempMinF: num(min[i]),
      precipInches: num(precip[i]),
      precipChance: num(chance[i]),
      snowfallInches: num(snow[i]),
      windMaxMph: num(wind[i]),
      gustMaxMph: num(gust[i]),
      sunrise: minutesFromIso(sunrise[i] as string),
      sunset: minutesFromIso(sunset[i] as string),
      code: num(code[i]),
    })),
  }
}

/** WMO weather codes, as used by Open-Meteo. */
export function describeCode(code: number | null): string {
  if (code === null) return 'UNKNOWN'
  if (code === 0) return 'Clear'
  if (code <= 2) return 'Mostly clear'
  if (code === 3) return 'Overcast'
  if (code <= 48) return 'Fog'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 86) return 'Snow showers'
  if (code <= 99) return 'Thunderstorms'
  return 'UNKNOWN'
}

export function findDay(
  result: WeatherResult | null,
  isoDate: string,
): DailyWeather | null {
  if (!result) return null
  return result.daily.find((d) => d.date === isoDate) ?? null
}

/**
 * Weather is one input, not a verdict. This returns plain observations for the
 * card rather than a "perfect day!" score.
 */
export function weatherNotes(day: DailyWeather | null, elevationFt: number | null): string[] {
  if (!day) return ['Forecast unavailable.']
  const notes: string[] = []
  if (day.tempMaxF !== null && day.tempMinF !== null) {
    notes.push(`${Math.round(day.tempMaxF)}° / ${Math.round(day.tempMinF)}°F`)
  }
  if (day.precipChance !== null && day.precipChance >= 30) {
    notes.push(`${Math.round(day.precipChance)}% chance of precipitation`)
  }
  if (day.snowfallInches !== null && day.snowfallInches > 0) {
    notes.push(`${day.snowfallInches.toFixed(1)}" snow in the forecast`)
  }
  if (day.gustMaxMph !== null && day.gustMaxMph >= 25) {
    notes.push(`gusts to ${Math.round(day.gustMaxMph)} mph`)
  }
  if (day.code !== null && day.code >= 95) {
    notes.push('Thunderstorms forecast — be off the high ground early')
  }
  if (elevationFt !== null && elevationFt >= 11000) {
    notes.push(`Forecast is elevation-corrected to ${elevationFt.toLocaleString()} ft`)
  }
  return notes.length > 0 ? notes : ['Nothing notable in the forecast.']
}
