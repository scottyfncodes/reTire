import { describeCode, findDay, weatherNotes } from '../services/weather'
import type { WeatherState } from '../state/useWeather'
import { formatClock } from '../engine/time'

export function WeatherPanel({
  state,
  isoDate,
  elevationFt,
  place,
}: {
  state: WeatherState
  isoDate: string
  elevationFt: number | null
  place: string
}) {
  if (state.loading) {
    return (
      <div className="card card--flat">
        <p className="tiny faint" style={{ margin: 0 }}>
          Loading forecast for {place}…
        </p>
      </div>
    )
  }

  if (state.error || !state.data) {
    return (
      <div className="card card--flat">
        <div className="eyebrow">Weather</div>
        <p className="tiny muted" style={{ margin: '6px 0 0' }}>
          Forecast unavailable — no network, or the forecast service did not
          answer. Nothing is being shown in its place.
        </p>
      </div>
    )
  }

  const day = findDay(state.data, isoDate)
  if (!day) {
    return (
      <div className="card card--flat">
        <div className="eyebrow">Weather</div>
        <p className="tiny muted" style={{ margin: '6px 0 0' }}>
          {isoDate} is outside the seven-day forecast window.
        </p>
      </div>
    )
  }

  const notes = weatherNotes(day, elevationFt)
  const ageMinutes = Math.round((Date.now() - state.data.fetchedAt) / 60000)

  return (
    <div className="card card--flat">
      <div className="eyebrow">Weather · {place}</div>
      <h3 className="headline" style={{ marginTop: 4 }}>
        {describeCode(day.code)}
      </h3>

      <div className="stats">
        <div className="stat">
          <div className="stat__value num">
            {day.tempMaxF === null ? 'UNKNOWN' : `${Math.round(day.tempMaxF)}°`}
          </div>
          <div className="stat__label">High</div>
        </div>
        <div className="stat">
          <div className="stat__value num">
            {day.tempMinF === null ? 'UNKNOWN' : `${Math.round(day.tempMinF)}°`}
          </div>
          <div className="stat__label">Overnight low</div>
        </div>
        <div className="stat">
          <div className="stat__value num">
            {day.precipChance === null ? '—' : `${Math.round(day.precipChance)}%`}
          </div>
          <div className="stat__label">Precip chance</div>
        </div>
        <div className="stat">
          <div className="stat__value num">
            {day.gustMaxMph === null ? '—' : `${Math.round(day.gustMaxMph)}`}
          </div>
          <div className="stat__label">Gusts mph</div>
        </div>
        <div className="stat">
          <div className="stat__value num">
            {day.sunrise === null ? '—' : formatClock(day.sunrise)}
          </div>
          <div className="stat__label">Sunrise</div>
        </div>
        <div className="stat">
          <div className="stat__value num">
            {day.sunset === null ? '—' : formatClock(day.sunset)}
          </div>
          <div className="stat__label">Sunset</div>
        </div>
      </div>

      <ul className="tiny muted" style={{ margin: '4px 0 8px', paddingLeft: 18 }}>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <p className="source" style={{ margin: 0 }}>
        Forecast from{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer noopener">
          Open-Meteo
        </a>
        {state.data.stale
          ? ` · served from cache, ${ageMinutes} min old — you are offline`
          : ` · fetched ${ageMinutes} min ago`}
        . Weather is one input into the plan, not a verdict on it.
      </p>
    </div>
  )
}
