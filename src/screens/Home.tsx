import { ADVENTURES_BY_ID, HOME } from '../data/adventures'
import { MODE_META } from '../engine/match'
import type { AdventureMode } from '../data/types'
import { useStore } from '../state/store'
import { useWeather } from '../state/useWeather'
import { WeatherPanel } from '../components/WeatherPanel'
import { SectionTitle } from '../components/Bits'
import { formatClock } from '../engine/time'

const MODE_ORDER: AdventureMode[] = [
  'big_day',
  'fourwd',
  'day_trip',
  'overnighter',
  'explorer',
  'full_send',
]

export function Home({ go }: { go: (path: string) => void }) {
  const { constraints, trips, log, online } = useStore()
  const weather = useWeather(HOME.lat, HOME.lon, HOME.elevationFt)

  const confirmed = trips.find((t) => t.confirmed)

  return (
    <div>
      <header className="masthead">
        <div className="wordmark">
          Ray<em>Tire</em>
        </div>
        <div className="tagline">Retirement, with a lot more altitude.</div>
      </header>

      {!online && (
        <div className="banner">
          Offline. Saved adventures still work in full; live weather, road
          closures and navigation do not.
        </div>
      )}

      {confirmed && (
        <button
          type="button"
          className="card card--tap"
          onClick={() => go(`trip/${confirmed.id}`)}
          style={{ borderColor: 'var(--ember)' }}
        >
          <div className="eyebrow" style={{ color: 'var(--ember)' }}>
            We're doing this
          </div>
          <h3 className="headline" style={{ marginTop: 4 }}>
            {confirmed.name}
          </h3>
          <p className="tiny faint" style={{ margin: '4px 0 0' }}>
            {confirmed.constraints.date} · leave{' '}
            {formatClock(confirmed.itinerary.departMinutes)}
          </p>
        </button>
      )}

      <h1 className="display" style={{ margin: '20px 0 4px' }}>
        What are we
        <br />
        doing today?
      </h1>
      <p className="tiny faint" style={{ marginBottom: 18 }}>
        {log.length === 0
          ? 'Your calendar is empty. Your Bronco isn’t.'
          : `${log.length} adventure${log.length === 1 ? '' : 's'} logged so far. Next.`}
      </p>

      <div className="mode-grid">
        {MODE_ORDER.map((mode) => (
          <button
            key={mode}
            type="button"
            className="mode"
            onClick={() => go(`mode/${mode}`)}
          >
            <span className="mode__glyph" aria-hidden="true">
              {MODE_META[mode].emoji}
            </span>
            <span>
              <span className="mode__label">{MODE_META[mode].label}</span>
              <span className="mode__blurb" style={{ display: 'block' }}>
                {MODE_META[mode].blurb}
              </span>
            </span>
          </button>
        ))}

        <button
          type="button"
          className="mode mode--wild"
          onClick={() => go('mode/dealers_choice')}
        >
          <span className="mode__glyph" aria-hidden="true">
            🎲
          </span>
          <span>
            <span className="mode__label">DEALER'S CHOICE</span>
            <span className="mode__blurb" style={{ display: 'block' }}>
              Let the app pick, based on today.
            </span>
          </span>
        </button>
      </div>

      <button
        type="button"
        className="btn btn--primary"
        style={{ marginTop: 14 }}
        onClick={() => go('builder')}
      >
        Build a day trip
      </button>

      <SectionTitle>Today in Durango</SectionTitle>
      <WeatherPanel
        state={weather}
        isoDate={constraints.date}
        elevationFt={HOME.elevationFt}
        place={HOME.label}
      />

      <p className="tiny faint" style={{ marginTop: 18 }}>
        {Object.keys(ADVENTURES_BY_ID).length} researched adventures from
        Durango. Every number in this app carries a source and a check date, and
        anything that could not be verified says UNKNOWN rather than guessing.
      </p>
    </div>
  )
}
