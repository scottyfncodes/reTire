import { useMemo } from 'react'
import type { InterestTag, PlanConstraints } from '../data/types'
import { buildItinerary } from '../engine/itinerary'
import { scoreAdventures } from '../engine/match'
import { recentAdventureIds } from '../engine/log'
import { useStore } from '../state/store'
import { AdventureCard } from '../components/AdventureCard'
import { SectionTitle } from '../components/Bits'
import { QuickControls } from './Results'

interface Variant {
  key: string
  title: string
  blurb: string
  interests: InterestTag[]
  appetite: PlanConstraints['hikeAppetite']
  offroadBias: 0 | 1 | 2 | 3
}

/**
 * Three genuinely different shapes of day rather than three near-identical
 * suggestions. Each one re-scores the same dataset with a different emphasis,
 * then the builder takes the best adventure each variant has not already used.
 */
const VARIANTS: Variant[] = [
  {
    key: 'history',
    title: 'Historic high country',
    blurb: 'Drive, mining country, a walk, a view, home.',
    interests: ['history', 'scenery', 'archaeology'],
    appetite: 'short',
    offroadBias: 1,
  },
  {
    key: 'bronco',
    title: 'Bronco day',
    blurb: 'The road is the point. Short legs, long wheelbase.',
    interests: ['offroad', 'remote', 'scenery'],
    appetite: 'short',
    offroadBias: 3,
  },
  {
    key: 'legs',
    title: 'Big legs',
    blurb: 'Longer drive, longer hike, late lunch.',
    interests: ['hiking', 'scenery', 'water'],
    appetite: 'long',
    offroadBias: 1,
  },
]

export function Builder({ go }: { go: (path: string) => void }) {
  const { constraints, setConstraints, profile, log } = useStore()

  const recentIds = useMemo(
    () => recentAdventureIds(log, constraints.date),
    [log, constraints.date],
  )

  const options = useMemo(() => {
    const used = new Set<string>()
    return VARIANTS.map((variant) => {
      const variantConstraints: PlanConstraints = {
        ...constraints,
        hikeAppetite:
          constraints.hikeAppetite === 'none' ? 'none' : variant.appetite,
        interests: variant.interests,
        modes: ['day_trip'],
      }
      const scored = scoreAdventures({
        mode: 'day_trip',
        constraints: variantConstraints,
        profile: { ...profile, offroad: variant.offroadBias },
        recentIds,
      })
      const pick =
        scored.find((s) => !used.has(s.adventure.id)) ?? scored[0] ?? null
      if (pick) used.add(pick.adventure.id)
      return { variant, pick, variantConstraints }
    })
  }, [constraints, profile, recentIds])

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <h1 className="display">Day trip builder</h1>
      <p className="tiny faint" style={{ marginBottom: 16 }}>
        Start and finish in Durango. Set the shape of the day, get three
        different ones back.
      </p>

      <div className="card card--flat">
        <QuickControls constraints={constraints} onChange={setConstraints} />
      </div>

      {options.map(({ variant, pick, variantConstraints }, i) => {
        if (!pick) return null
        const itinerary = buildItinerary({
          adventure: pick.adventure,
          constraints: variantConstraints,
          profile,
        })
        return (
          <div key={variant.key}>
            <SectionTitle>
              Option {String.fromCharCode(65 + i)} · {variant.title}
            </SectionTitle>
            <p className="tiny faint" style={{ marginTop: -4, marginBottom: 10 }}>
              {variant.blurb}
            </p>
            <AdventureCard
              adventure={pick.adventure}
              itinerary={itinerary}
              reasons={pick.reasons}
              blockers={pick.blockers}
              onOpen={() => go(`adventure/${pick.adventure.id}`)}
            />
          </div>
        )
      })}

      <p className="tiny faint">
        Open any option to change the hike, the food stop or the times without
        rebuilding the day from scratch.
      </p>
    </div>
  )
}
