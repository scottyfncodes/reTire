import { describe, expect, it } from 'vitest'
import type { OffroadRoute, RigProfile, TrailRating } from '../../data/types'
import {
  difficultyRange,
  FEATURE_META,
  formatDifficultyRange,
  GLOSSARY,
  ladder,
  mapSearchUrl,
  RATING_META,
  RIG_CHOICES,
  rigVerdict,
  terrainLine,
} from '../offroad'
import { DESTINATIONS_BY_ID, UTAH_DESTINATIONS } from '../../data/utah'
import { parse } from '../../state/useRoute'

function route(rating: TrailRating, rig: OffroadRoute['rig'] = 'four_wd', id: string = rating): OffroadRoute {
  return {
    id,
    name: `Route ${id}`,
    blurb: '',
    rating,
    published: [],
    ratingBasis: '',
    miles: null,
    features: [],
    rig,
    hazards: [],
    officialUrl: null,
    mapQuery: 'x',
    sources: [],
    lastChecked: '2026-01-01',
  }
}

const BRONCO: RigProfile = { name: 'Ford Bronco', rigClass: 'four_wd' }

describe('difficultyRange', () => {
  it('spans easiest to hardest rated route', () => {
    const r = difficultyRange([route('advanced'), route('beginner'), route('intermediate')])
    expect(r).toEqual({ low: 'beginner', high: 'advanced', rated: 3, unrated: 0 })
    expect(formatDifficultyRange(r)).toBe('🟢 → 🔴')
  })

  it('counts unrated routes instead of guessing them', () => {
    const r = difficultyRange([route('beginner'), route('unknown', 'four_wd', 'u1')])
    expect(r.unrated).toBe(1)
    expect(formatDifficultyRange(r)).toBe('🟢 +1 ⚪')
  })

  it('says Not rated when nothing is rated', () => {
    const r = difficultyRange([route('unknown')])
    expect(r.low).toBeNull()
    expect(formatDifficultyRange(r)).toBe('⚪ Not rated')
    expect(formatDifficultyRange(difficultyRange([]))).toBe('⚪ Not rated')
  })

  it('shows Moab as the full 🟢 → 🔴 spread', () => {
    expect(formatDifficultyRange(difficultyRange(DESTINATIONS_BY_ID.moab.routes))).toBe('🟢 → 🔴')
  })
})

describe('ladder', () => {
  it('orders Start here -> Build confidence -> A-game -> Not rated and drops empty steps', () => {
    const steps = ladder([route('unknown'), route('advanced'), route('beginner')]).map((s) => s.step)
    expect(steps).toEqual(['start_here', 'a_game', 'unrated'])
  })

  it('never loses a route', () => {
    for (const d of UTAH_DESTINATIONS) {
      const count = ladder(d.routes).reduce((n, s) => n + s.routes.length, 0)
      expect(count, d.id).toBe(d.routes.length)
    }
  })

  it('gives Moab all three rungs', () => {
    expect(ladder(DESTINATIONS_BY_ID.moab.routes).map((s) => s.step)).toEqual([
      'start_here',
      'build_confidence',
      'a_game',
    ])
  })
})

describe('rigVerdict', () => {
  it('says a stock 4WD meets a 4WD route, and never calls it safe', () => {
    const v = rigVerdict(BRONCO, route('intermediate', 'four_wd'))
    expect(v.fit).toBe('meets')
    expect(v.message).toContain('Ford Bronco')
    expect(v.message).toMatch(/not the same as safe/)
  })

  it('flags a route that asks for more than the rig as entered', () => {
    const v = rigVerdict(BRONCO, route('advanced', 'advanced_4wd'))
    expect(v.fit).toBe('short')
    expect(v.message).toMatch(/beyond/)
  })

  it('works for any vehicle, not just the Bronco', () => {
    const crv: RigProfile = { name: 'Honda CR-V', rigClass: 'standard_suv' }
    expect(rigVerdict(crv, route('beginner', 'high_clearance')).fit).toBe('short')
    expect(rigVerdict(crv, route('beginner', 'standard_suv')).fit).toBe('meets')
    const built: RigProfile = { name: 'Built JK', rigClass: 'advanced_4wd' }
    expect(rigVerdict(built, route('advanced', 'advanced_4wd')).fit).toBe('meets')
  })

  it('asks for a check on OHV-rule routes and for OHVs on road routes', () => {
    expect(rigVerdict(BRONCO, route('unknown', 'specialized')).fit).toBe('check')
    const utv: RigProfile = { name: 'RZR', rigClass: 'specialized' }
    expect(rigVerdict(utv, route('beginner', 'high_clearance')).fit).toBe('check')
  })

  it('reports unknown requirements as unknown', () => {
    expect(rigVerdict(BRONCO, route('unknown', 'unknown')).fit).toBe('unknown')
  })

  it('copes with a blank vehicle name', () => {
    const v = rigVerdict({ name: '  ', rigClass: 'four_wd' }, route('beginner', 'high_clearance'))
    expect(v.message).toContain('Your rig')
  })

  it('offers every vehicle class in the profile picker, easiest first', () => {
    expect(RIG_CHOICES.map((c) => c.value)).toEqual([
      'standard_suv',
      'high_clearance',
      'four_wd',
      'advanced_4wd',
      'specialized',
    ])
  })
})

describe('labels', () => {
  it('uses the three-colour scale plus an explicit Not rated', () => {
    expect(RATING_META.beginner.dot).toBe('🟢')
    expect(RATING_META.intermediate.dot).toBe('🟡')
    expect(RATING_META.advanced.dot).toBe('🔴')
    expect(RATING_META.unknown.label).toBe('Not rated')
  })

  it('has a label for every feature used in the data', () => {
    for (const d of UTAH_DESTINATIONS) {
      for (const f of [...d.terrain, ...d.routes.flatMap((r) => r.features)]) {
        expect(FEATURE_META[f], f).toBeDefined()
      }
    }
    expect(terrainLine(DESTINATIONS_BY_ID.moab)).toBe('Slickrock / Sand / Rock crawling')
  })

  it('explains the jargon a newcomer will meet', () => {
    const terms = GLOSSARY.map((g) => g.term)
    for (const t of ['Slickrock', 'Low range', 'Airing down', 'Lockers', 'Whip flag']) {
      expect(terms).toContain(t)
    }
  })

  it('builds a name-based maps search', () => {
    expect(mapSearchUrl("Hell's Revenge Trailhead")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Hell's%20Revenge%20Trailhead",
    )
  })
})

describe('routing', () => {
  it('parses Utah routes', () => {
    expect(parse('#/region/utah')).toEqual({ name: 'region', id: 'utah' })
    expect(parse('#/dest/moab')).toEqual({ name: 'destination', id: 'moab' })
  })

  it('sends Colorado and bare paths home', () => {
    expect(parse('#/region/colorado')).toEqual({ name: 'home' })
    expect(parse('#/region')).toEqual({ name: 'home' })
    expect(parse('#/dest')).toEqual({ name: 'home' })
  })

  it('leaves the existing routes alone', () => {
    expect(parse('#/')).toEqual({ name: 'home' })
    expect(parse('#/adventure/ice_lake_basin_day')).toEqual({ name: 'adventure', id: 'ice_lake_basin_day' })
    expect(parse('#/mode/fourwd')).toEqual({ name: 'mode', mode: 'fourwd' })
    expect(parse('#/trip/abc')).toEqual({ name: 'trip', id: 'abc' })
    expect(parse('#/profile')).toEqual({ name: 'profile' })
  })
})
