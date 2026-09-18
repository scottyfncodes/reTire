import { useMemo, useState } from 'react'
import type { AdventureMode, PlanConstraints } from '../data/types'
import { dealersChoice, MODE_META, scoreAdventures } from '../engine/match'
import { buildItinerary } from '../engine/itinerary'
import { recentAdventureIds } from '../engine/log'
import { useStore } from '../state/store'
import { AdventureCard } from '../components/AdventureCard'
import { Segmented } from '../components/Bits'

const MODES = Object.keys(MODE_META) as AdventureMode[]

export function Results({
  mode,
  go,
}: {
  mode: string
  go: (path: string) => void
}) {
  const { constraints, setConstraints, profile, log } = useStore()
  const [seed, setSeed] = useState(0)

  const isDealers = mode === 'dealers_choice'
  const realMode = MODES.includes(mode as AdventureMode)
    ? (mode as AdventureMode)
    : null

  const recentIds = useMemo(
    () => recentAdventureIds(log, constraints.date),
    [log, constraints.date],
  )

  const scored = useMemo(
    () =>
      scoreAdventures({
        mode: realMode,
        constraints,
        profile,
        recentIds,
      }),
    [realMode, constraints, profile, recentIds],
  )

  const shown = useMemo(() => {
    if (!isDealers) return scored.slice(0, 6)
    // Deterministic per press of "deal again", not per render.
    const pick = dealersChoice(scored, () => pseudoRandom(seed))
    return pick ? [pick] : []
  }, [isDealers, scored, seed])

  const meta = realMode ? MODE_META[realMode] : null

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <h1 className="display" style={{ marginBottom: 4 }}>
        {meta ? `${meta.emoji} ${meta.label}` : "🎲 Dealer's choice"}
      </h1>
      <p className="tiny faint" style={{ marginBottom: 16 }}>
        {meta
          ? meta.blurb
          : 'One adventure, chosen from what actually works today.'}
      </p>

      <div className="card card--flat">
        <QuickControls constraints={constraints} onChange={setConstraints} />
      </div>

      {isDealers && (
        <button
          type="button"
          className="btn"
          style={{ marginBottom: 14 }}
          onClick={() => setSeed((s) => s + 1)}
        >
          Deal again
        </button>
      )}

      {shown.length === 0 && (
        <p className="muted">
          Nothing in the dataset matches that. Widen the driving limit or the
          date.
        </p>
      )}

      {shown.map(({ adventure, reasons, blockers }) => {
        const itinerary = buildItinerary({
          adventure,
          constraints,
          profile,
          overnight: adventure.modes.includes('overnighter') && realMode === 'overnighter',
        })
        return (
          <AdventureCard
            key={adventure.id}
            adventure={adventure}
            itinerary={itinerary}
            reasons={reasons}
            blockers={blockers}
            onOpen={() => go(`adventure/${adventure.id}`)}
          />
        )
      })}

      <p className="tiny faint">
        Routes outside their usual season are kept in the list and labelled
        rather than hidden — the date is a fact you can overrule, not something
        the app should decide for you.
      </p>
    </div>
  )
}

export function QuickControls({
  constraints,
  onChange,
}: {
  constraints: PlanConstraints
  onChange: (next: PlanConstraints) => void
}) {
  return (
    <>
      <label className="field">
        <span className="field__label">Date</span>
        <input
          type="date"
          value={constraints.date}
          onChange={(e) => onChange({ ...constraints, date: e.target.value })}
        />
      </label>

      <Segmented
        label="Leave"
        value={String(constraints.earliestDeparture)}
        options={[
          { value: '360', label: '6:00' },
          { value: '420', label: '7:00' },
          { value: '480', label: '8:00' },
          { value: '540', label: '9:00' },
          { value: '600', label: '10:00' },
        ]}
        onChange={(v) => onChange({ ...constraints, earliestDeparture: Number(v) })}
      />

      <Segmented
        label="Home by"
        value={String(constraints.homeByMinutes)}
        options={[
          { value: '960', label: '4 PM' },
          { value: '1080', label: '6 PM' },
          { value: '1110', label: '6:30' },
          { value: '1200', label: '8 PM' },
          { value: '1260', label: '9 PM' },
        ]}
        onChange={(v) => onChange({ ...constraints, homeByMinutes: Number(v) })}
      />

      <Segmented
        label="Driving"
        value={String(constraints.maxDriveMinutes)}
        options={[
          { value: '45', label: 'Short' },
          { value: '120', label: 'Moderate' },
          { value: '240', label: 'Long' },
        ]}
        onChange={(v) => onChange({ ...constraints, maxDriveMinutes: Number(v) })}
      />

      <Segmented
        label="Hiking"
        value={constraints.hikeAppetite}
        options={[
          { value: 'none' as const, label: 'None' },
          { value: 'short' as const, label: 'Short' },
          { value: 'moderate' as const, label: 'Moderate' },
          { value: 'long' as const, label: 'Long' },
        ]}
        onChange={(v) => onChange({ ...constraints, hikeAppetite: v })}
      />

      <Segmented
        label="Food"
        value={constraints.food}
        options={[
          { value: 'none' as const, label: 'None' },
          { value: 'lunch' as const, label: 'Lunch' },
          { value: 'brewery' as const, label: 'Brewery' },
          { value: 'dinner' as const, label: 'Dinner' },
          { value: 'surprise' as const, label: 'Surprise' },
        ]}
        onChange={(v) => onChange({ ...constraints, food: v })}
      />
    </>
  )
}

/** Stable pseudo-random from an integer, so a re-render does not re-deal. */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
