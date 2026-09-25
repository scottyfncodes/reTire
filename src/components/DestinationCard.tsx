import type { Destination } from '../data/types'
import {
  difficultyRange,
  formatDifficultyRange,
  RIG_SHORT,
  STYLE_LABEL,
  terrainLine,
} from '../engine/offroad'
import { formatMeasure } from '../engine/measure'
import { formatSeasonMonths } from '../engine/season'
import { formatDurationRange } from '../engine/itinerary'

/** At-a-glance card for a destination: where, what, how hard, how far, when. */
export function DestinationCard({
  destination,
  onOpen,
}: {
  destination: Destination
  onOpen: () => void
}) {
  const range = difficultyRange(destination.routes)
  const drive = destination.fromDurango
  const easiestRig = destination.routes
    .map((r) => r.rig)
    .find((r) => r === 'standard_suv' || r === 'high_clearance')

  return (
    <button
      type="button"
      className={destination.flagship ? 'card card--tap dest-card dest-card--flagship' : 'card card--tap dest-card'}
      onClick={onOpen}
      aria-label={`${destination.name}: open destination`}
    >
      {destination.flagship && (
        <div className="eyebrow dest-card__flag">Flagship · Start with this one</div>
      )}
      <div className="dest-card__head">
        <span className="dest-card__emoji" aria-hidden="true">
          {destination.emoji}
        </span>
        <div>
          <h3 className="headline">{destination.name}</h3>
          <p className="tiny faint" style={{ margin: '2px 0 0' }}>
            📍 {destination.area}
          </p>
        </div>
      </div>

      <p className="tiny muted" style={{ margin: '10px 0' }}>
        {destination.tagline}
      </p>

      <div className="dest-card__facts">
        <Fact label="Terrain" value={terrainLine(destination)} />
        <Fact label="Difficulty" value={formatDifficultyRange(range)} />
        <Fact
          label="From Durango"
          value={
            drive
              ? `${formatMeasure(drive.miles, 'mi')} · ${formatDurationRange(drive.minutes)}`
              : 'UNKNOWN'
          }
        />
        <Fact label="Best season" value={formatSeasonMonths(destination.season)} />
      </div>

      <div className="chips" style={{ marginTop: 10 }}>
        {destination.styles.map((s) => (
          <span key={s} className="chip">
            {STYLE_LABEL[s]}
          </span>
        ))}
        {easiestRig && (
          <span className="chip chip--truck">Starts at {RIG_SHORT[easiestRig]}</span>
        )}
        {destination.skillsSchool && (
          <span className="chip chip--depth">🐎 {destination.skillsSchool.name}</span>
        )}
      </div>
    </button>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="dest-card__fact">
      <div className="stat__label">{label}</div>
      <div
        className="dest-card__value"
        style={value === 'UNKNOWN' ? { color: 'var(--caution)' } : undefined}
      >
        {value}
      </div>
    </div>
  )
}
