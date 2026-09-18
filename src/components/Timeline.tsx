import type { Itinerary } from '../data/types'
import { formatClock, formatDuration } from '../engine/time'

const GLYPH: Record<string, string> = {
  depart: '🏠',
  drive: '🚙',
  stop: '📍',
  hike: '🥾',
  food: '🍺',
  camp: '⛺',
  arrive: '🏠',
}

export function Timeline({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="timeline">
      {itinerary.legs.map((leg, i) => {
        const minutes = leg.endMinutes - leg.startMinutes
        return (
          <div key={i} className={`tl tl--${leg.kind}`}>
            <span className="tl__time num">{formatClock(leg.startMinutes)}</span>
            <span className="tl__dot" aria-hidden="true" />
            <div className="tl__title">
              <span style={{ marginRight: 6 }} aria-hidden="true">
                {GLYPH[leg.kind]}
              </span>
              {leg.title}
              {minutes > 0 && (
                <span className="faint" style={{ fontWeight: 500, marginLeft: 6 }}>
                  {formatDuration(minutes)}
                  {leg.estimated ? ' est.' : ''}
                </span>
              )}
            </div>
            <div className="tl__detail">{leg.detail}</div>
          </div>
        )
      })}
    </div>
  )
}
