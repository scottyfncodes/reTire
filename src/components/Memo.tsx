import type { Adventure, Itinerary } from '../data/types'
import { buildMemo } from '../engine/memo'

export function Memo({
  adventure,
  itinerary,
}: {
  adventure: Adventure
  itinerary: Itinerary
}) {
  const lines = buildMemo(adventure, itinerary)
  return (
    <div className="card">
      <div className="eyebrow">Adventure investment memo</div>
      <h3 className="headline" style={{ margin: '4px 0 12px' }}>
        {adventure.name}
      </h3>
      <div className="memo">
        {lines.map((line) => (
          <div key={line.heading}>
            <div className="memo__heading">{line.heading}</div>
            <div className="memo__body">
              {line.body.map((body, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0' }}>
                  {body}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="tiny faint" style={{ margin: '16px 0 0' }}>
        Past performance in the San Juans is no guarantee of future weather.
      </p>
    </div>
  )
}
