import { useEffect, useState } from 'react'
import { fetchWeather, type WeatherResult } from '../services/weather'

export interface WeatherState {
  data: WeatherResult | null
  loading: boolean
  error: string | null
}

/**
 * Forecast for one point. A failure is reported as a failure -- the app never
 * substitutes a plausible-looking forecast for a missing one.
 */
export function useWeather(
  lat: number | null,
  lon: number | null,
  elevationFt: number | null,
): WeatherState {
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: lat !== null,
    error: null,
  })

  useEffect(() => {
    if (lat === null || lon === null) {
      setState({ data: null, loading: false, error: null })
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))

    fetchWeather(lat, lon, elevationFt, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          data: null,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Forecast unavailable.',
        })
      })

    return () => controller.abort()
  }, [lat, lon, elevationFt])

  return state
}
