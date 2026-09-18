import type { Adventure, Itinerary } from '../data/types'
import { DEPTH_LABEL } from '../engine/depth'
import { VEHICLE_LABEL } from '../engine/drive'
import { formatMeasure } from '../engine/measure'
import { formatClock, formatDuration } from '../engine/time'
import { FOOD_BY_ID } from '../data/food'

export function AdventureCard({
  adventure,
  itinerary,
  reasons,
  blockers,
  onOpen,
}: {
  adventure: Adventure
  itinerary: Itinerary
  reasons: string[]
  blockers: string[]
  onOpen: () => void
}) {
  const food = itinerary.foodId ? FOOD_BY_ID[itinerary.foodId] : null
  const truck =
    itinerary.vehicle === 'four_wd' || itinerary.vehicle === 'four_wd_low_range'

  return (
    <button type="button" className="card card--tap" onClick={onOpen}>
      <div className="chips" style={{ marginBottom: 8 }}>
        <span className="chip chip--depth">{DEPTH_LABEL[itinerary.depth]}</span>
        {truck && <span className="chip chip--truck">{VEHICLE_LABEL[itinerary.vehicle]}</span>}
        {itinerary.vehicle === 'unknown' && (
          <span className="chip chip--unknown">ACCESS STATUS UNKNOWN</span>
        )}
        {itinerary.overnight && <span className="chip">⛺ Overnight</span>}
      </div>

      <h3 className="headline">{adventure.name}</h3>
      <p className="tiny faint" style={{ margin: '4px 0 0' }}>
        {adventure.region} · {adventure.tagline}
      </p>

      <div className="stats">
        <Cell
          glyph={'\u{1F699}'}
          value={formatDuration(itinerary.driveMinutes)}
          label={`${formatMeasure(itinerary.driveMiles, 'mi')}${itinerary.unmeasuredLegs > 0 ? '+' : ''} round trip`}
        />
        {itinerary.hikeId ? (
          <Cell
            glyph={'\u{1F97E}'}
            value={formatMeasure(itinerary.hikeMiles, 'mi', { decimals: 1 })}
            label={`${formatMeasure(itinerary.gainFt, 'ft')} gain`}
          />
        ) : (
          <Cell glyph={'\u{1F97E}'} value="No hike" label="Driving day" />
        )}
        <Cell
          glyph={'\u{1F3D4}\uFE0F'}
          value={formatMeasure(itinerary.maxElevationFt, 'ft')}
          label="High point"
        />
      </div>

      <p className="tiny muted" style={{ margin: '4px 0 10px' }}>
        {adventure.why}
      </p>

      <div className="chips">
        <span className="chip">
          Leave {formatClock(itinerary.departMinutes)}
        </span>
        <span className="chip">
          {itinerary.overnight
            ? 'Camp for the night'
            : `Home ${formatClock(itinerary.homeMinutes)}`}
        </span>
        {food && <span className="chip">{'\u{1F37A}'} {food.name}</span>}
      </div>

      {(reasons.length > 0 || blockers.length > 0) && (
        <p className="tiny faint" style={{ margin: '10px 0 0' }}>
          {blockers.length > 0 ? `⚠ ${blockers.join(' · ')}` : reasons.join(' · ')}
        </p>
      )}
    </button>
  )
}

function Cell({
  glyph,
  value,
  label,
}: {
  glyph: string
  value: string
  label: string
}) {
  return (
    <div className="stat">
      <div className="stat__value">
        <span style={{ fontSize: 13, marginRight: 4 }}>{glyph}</span>
        {value}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}
