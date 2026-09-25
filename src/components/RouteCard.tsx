import type { OffroadRoute, RigProfile } from '../data/types'
import { FEATURE_META, mapSearchUrl, RATING_META, RIG_LABEL, rigVerdict } from '../engine/offroad'
import { formatMeasure } from '../engine/measure'
import { sourcesFor } from '../data/sources'
import { SourceLine } from './Bits'

/**
 * One route. Collapsed it is a single scannable row -- colour, name, one line.
 * Tapped open it shows who rated it and why, what the ground is like, what
 * the vehicle needs, the hazards, and the links out.
 */
export function RouteCard({
  route,
  rig,
  open,
  onToggle,
}: {
  route: OffroadRoute
  rig: RigProfile
  open: boolean
  onToggle: () => void
}) {
  const meta = RATING_META[route.rating]
  const verdict = rigVerdict(rig, route)
  const bodyId = `route-${route.id}`

  return (
    <div className={`card card--flat route route--${route.rating}`}>
      <button
        type="button"
        className="route__head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="route__dot" aria-hidden="true">
          {meta.dot}
        </span>
        <span className="route__title">
          <span className="route__name">{route.name}</span>
          <span className="route__rating">
            {meta.label}
            {route.miles !== null && ` · ${formatMeasure(route.miles, 'mi', { decimals: 1 })}`}
          </span>
        </span>
        <span className="route__chev" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      <p className="tiny muted" style={{ margin: '8px 0 0' }}>
        {route.blurb}
      </p>

      {open && (
        <div id={bodyId} className="route__body">
          <div className="chips" style={{ margin: '10px 0' }}>
            {route.features.map((f) => (
              <span key={f} className="chip">
                {FEATURE_META[f].emoji} {FEATURE_META[f].label}
              </span>
            ))}
          </div>

          <div className="eyebrow">Difficulty</div>
          <p className="tiny muted" style={{ margin: '4px 0 6px' }}>
            <strong style={{ color: 'var(--bone)' }}>
              {meta.dot} {meta.label}.
            </strong>{' '}
            {route.ratingBasis}
          </p>
          {route.published.length > 0 ? (
            <ul className="tiny faint" style={{ paddingLeft: 18, margin: '0 0 10px' }}>
              {route.published.map((p) => (
                <li key={p.by + p.says}>
                  {sourcesFor([p.by])[0]?.org ?? p.by}: “{p.says}”
                </li>
              ))}
            </ul>
          ) : (
            <p className="tiny" style={{ color: 'var(--caution)', margin: '0 0 10px' }}>
              No published rating found.
            </p>
          )}

          <div className="eyebrow">Vehicle</div>
          <p className="tiny muted" style={{ margin: '4px 0 6px' }}>
            {RIG_LABEL[route.rig]}
          </p>
          <div className={`warn warn--${verdict.fit === 'meets' ? 'info' : 'caution'}`}>
            <span className="warn__mark" aria-hidden="true">
              {verdict.fit === 'meets' ? 'i' : '!'}
            </span>
            <span>{verdict.message}</span>
          </div>

          <div className="eyebrow" style={{ marginTop: 10 }}>
            Distance
          </div>
          <p className="tiny muted" style={{ margin: '4px 0 10px' }}>
            {route.miles === null ? (
              <span style={{ color: 'var(--caution)' }}>UNKNOWN</span>
            ) : (
              formatMeasure(route.miles, 'mi', { decimals: 1 })
            )}
            {route.milesNote ? ` — ${route.milesNote}` : ''}
          </p>

          {route.hazards.length > 0 && (
            <>
              <div className="eyebrow">Know before you go</div>
              <ul className="tiny muted" style={{ paddingLeft: 18, margin: '4px 0 10px' }}>
                {route.hazards.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </>
          )}

          <div className="btn-row">
            <a
              className="btn"
              href={mapSearchUrl(route.mapQuery)}
              target="_blank"
              rel="noreferrer noopener"
            >
              🗺️ Map
            </a>
            {route.officialUrl ? (
              <a
                className="btn"
                href={route.officialUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Official page ↗
              </a>
            ) : (
              <span className="btn btn--ghost btn--disabled" aria-disabled="true">
                No official page
              </span>
            )}
          </div>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            The map link searches by name to find the trailhead; it is not a
            route. Carry an offline trail map for the drive itself.
          </p>

          <SourceLine ids={route.sources} lastChecked={route.lastChecked} />
        </div>
      )}
    </div>
  )
}

