import { summarize } from '../engine/log'
import { useStore } from '../state/store'
import { BigStat, SectionTitle } from '../components/Bits'

export function LogScreen({ go }: { go: (path: string) => void }) {
  const { log, removeLogEntry, addLogEntry } = useStore()
  const stats = summarize(log)

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <h1 className="display">Adventure log</h1>
      <p className="tiny faint" style={{ marginBottom: 16 }}>
        What actually happened, which is a different thing from what was
        planned.
      </p>

      <div className="grid-3">
        <BigStat label="Adventures" value={String(stats.adventures)} />
        <BigStat label="Miles driven" value={stats.milesDriven.toLocaleString()} />
        <BigStat label="Miles hiked" value={String(stats.milesHiked)} />
        <BigStat
          label="Feet climbed"
          value={stats.elevationGained.toLocaleString()}
        />
        <BigStat label="Nights out" value={String(stats.nightsOut)} />
        <BigStat label="Breweries" value={String(stats.breweries)} />
      </div>

      <SectionTitle>History</SectionTitle>

      {log.length === 0 && (
        <p className="muted">
          Nothing logged yet. Open an adventure and mark it done when you get
          back.
        </p>
      )}

      {log.map((entry) => (
        <div key={entry.id} className="card card--flat">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{entry.name}</h3>
              <p className="tiny faint" style={{ margin: '2px 0 0' }}>
                {entry.date}
                {entry.overnight ? ' · slept out' : ''}
              </p>
            </div>
            <button
              type="button"
              className="chip"
              onClick={() =>
                addLogEntry({ ...entry, favorite: !entry.favorite })
              }
              aria-label="Toggle favourite"
            >
              {entry.favorite ? '★' : '☆'}
            </button>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat__value num">{entry.driveMiles ?? '—'}</div>
              <div className="stat__label">Drive mi</div>
            </div>
            <div className="stat">
              <div className="stat__value num">{entry.hikeMiles ?? '—'}</div>
              <div className="stat__label">Hike mi</div>
            </div>
            <div className="stat">
              <div className="stat__value num">{entry.gainFt ?? '—'}</div>
              <div className="stat__label">Gain ft</div>
            </div>
          </div>

          <textarea
            value={entry.notes}
            placeholder="How was it?"
            onChange={(e) => addLogEntry({ ...entry, notes: e.target.value })}
          />

          <button
            type="button"
            className="btn btn--ghost"
            style={{ marginTop: 10 }}
            onClick={() => removeLogEntry(entry.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
