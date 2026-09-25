import { REGIONS_BY_ID, destinationsIn } from '../data/regions'
import { sourcesFor } from '../data/sources'
import { GLOSSARY, RATING_META } from '../engine/offroad'
import type { TrailRating } from '../data/types'
import { useStore } from '../state/store'
import { RegionSwitch } from '../components/RegionSwitch'
import { DestinationCard } from '../components/DestinationCard'
import { SectionTitle } from '../components/Bits'

const SCALE: TrailRating[] = ['beginner', 'intermediate', 'advanced', 'unknown']

export function RegionScreen({ id, go }: { id: string; go: (path: string) => void }) {
  const { profile } = useStore()
  const region = REGIONS_BY_ID[id]

  if (!region || region.home) {
    return (
      <div>
        <button type="button" className="backlink" onClick={() => go('')}>
          ← Home
        </button>
        <p className="muted">That region is not in the app yet.</p>
      </div>
    )
  }

  const destinations = destinationsIn(region.id)
  const [flagship, ...rest] = destinations
  const rigName = profile.rig.name.trim() || 'the rig'

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <RegionSwitch current={region.id} go={go} />

      <h1 className="display" style={{ margin: '18px 0 4px' }}>
        {region.emoji} {region.name}
      </h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {region.tagline}
      </p>
      <p className="tiny faint" style={{ marginBottom: 16 }}>
        Not day trips any more — these are places you drive to and explore
        from. Pick a place, see how hard it gets, and take the {rigName} as far
        as feels right.
      </p>

      {flagship && (
        <DestinationCard destination={flagship} onOpen={() => go(`dest/${flagship.id}`)} />
      )}

      <SectionTitle>More of {region.name}</SectionTitle>
      {rest.map((d) => (
        <DestinationCard key={d.id} destination={d} onOpen={() => go(`dest/${d.id}`)} />
      ))}

      <SectionTitle>How routes are rated</SectionTitle>
      <div className="card card--flat">
        {SCALE.map((r) => (
          <p key={r} className="tiny" style={{ margin: '0 0 8px' }}>
            <strong>
              {RATING_META[r].dot} {RATING_META[r].label}
            </strong>{' '}
            <span className="muted">— {RATING_META[r].blurb}</span>
          </p>
        ))}
        <p className="tiny faint" style={{ margin: '8px 0 0' }}>
          The colour is a summary, never a promise. Every route shows who
          actually rated it and why, and a Beginner route in the rain can be
          harder than an Advanced one in the dry.
        </p>
      </div>

      <details className="card card--flat glossary">
        <summary className="glossary__summary">New to this? What the words mean</summary>
        <dl className="glossary__list">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="glossary__item">
              <dt>{g.term}</dt>
              <dd className="tiny muted">{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>

      <SectionTitle>Before any {region.name} trip</SectionTitle>
      <div className="card card--flat">
        <p className="tiny muted" style={{ marginTop: 0 }}>
          Live closures, fire restrictions and road conditions are not stored
          in this app — anything stored would be stale. Check these the day you
          go:
        </p>
        <div className="link-list">
          {sourcesFor(region.conditions).map((s) => (
            <a key={s.id} className="link-list__item" href={s.url} target="_blank" rel="noreferrer noopener">
              <span>{s.label}</span>
              <span className="tiny faint">{s.org} ↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
