import { describe, expect, it } from 'vitest'
import { ADVENTURES } from '../../data/adventures'
import { DEFAULT_PROFILE, defaultConstraints } from '../../data/profile'
import type { PlanConstraints } from '../../data/types'
import { dealersChoice, scoreAdventures } from '../match'
import { estimateDrive } from '../drive'
import { high } from '../measure'

const SUMMER = '2026-07-15'

function constraints(overrides: Partial<PlanConstraints> = {}): PlanConstraints {
  return { ...defaultConstraints(SUMMER), ...overrides }
}

describe('filtering by mode', () => {
  it('puts matching routes above non-matching ones', () => {
    const scored = scoreAdventures({
      mode: 'fourwd',
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(scored[0].adventure.modes).toContain('fourwd')
  })

  it('keeps every adventure in the list rather than hiding mismatches', () => {
    const scored = scoreAdventures({
      mode: 'overnighter',
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(scored).toHaveLength(ADVENTURES.length)
    expect(
      scored.filter((s) => s.adventure.modes.includes('overnighter')).length,
    ).toBeGreaterThan(0)
  })

  it('explains why a route does not fit', () => {
    const scored = scoreAdventures({
      mode: 'overnighter',
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    const mismatch = scored.find(
      (s) => !s.adventure.modes.includes('overnighter'),
    )
    expect(mismatch?.blockers.join(' ')).toContain('overnighter')
  })

  it('is sorted best first', () => {
    const scored = scoreAdventures({
      mode: null,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    for (let i = 1; i < scored.length; i += 1) {
      expect(scored[i - 1].score).toBeGreaterThanOrEqual(scored[i].score)
    }
  })
})

describe('filtering by season', () => {
  it('demotes high-country routes in winter without deleting them', () => {
    const winter = scoreAdventures({
      mode: null,
      constraints: constraints({ date: '2026-01-15' }),
      profile: DEFAULT_PROFILE,
    })
    const iceLake = winter.find((s) => s.adventure.id === 'ice_lake_basin_day')
    expect(iceLake).toBeDefined()
    expect(iceLake?.blockers).toContain('Normally out of season on this date')
    expect(winter[0].adventure.id).not.toBe('ice_lake_basin_day')
  })

  it('favours low-elevation routes in the shoulder season', () => {
    const november = scoreAdventures({
      mode: 'day_trip',
      constraints: constraints({ date: '2026-11-10' }),
      profile: DEFAULT_PROFILE,
    })
    const top = november.slice(0, 3).map((s) => s.adventure.id)
    expect(
      top.some((id) => ['hermosa_shoulder', 'animas_mountain_quick'].includes(id)),
    ).toBe(true)
  })
})

describe('filtering by drive time', () => {
  it('demotes routes past the driving limit and says so', () => {
    const scored = scoreAdventures({
      mode: null,
      constraints: constraints({ maxDriveMinutes: 30 }),
      profile: DEFAULT_PROFILE,
    })
    const farAway = scored.find((s) => s.adventure.id === 'ice_lake_basin_day')
    expect(farAway?.blockers).toContain('Longer drive than you asked for')

    // A stated limit has to actually move the winner, not just annotate it.
    const driveOf = (id: string) =>
      high(estimateDrive(ADVENTURES.find((a) => a.id === id)!.outbound).minutes) ?? 0
    expect(driveOf(scored[0].adventure.id)).toBeLessThanOrEqual(30)
    expect(scored[0].blockers).not.toContain('Longer drive than you asked for')
  })

  it('takes the tighter of the day limit and the profile limit', () => {
    const tightProfile = scoreAdventures({
      mode: null,
      constraints: constraints({ maxDriveMinutes: 600 }),
      profile: { ...DEFAULT_PROFILE, maxDriveMinutes: 30 },
    })
    expect(
      tightProfile.find((s) => s.adventure.id === 'ice_lake_basin_day')?.blockers,
    ).toContain('Longer drive than you asked for')
  })
})

describe('filtering by appetite and profile', () => {
  it('prefers short walks when the appetite is short', () => {
    const scored = scoreAdventures({
      mode: null,
      constraints: constraints({ hikeAppetite: 'short' }),
      profile: DEFAULT_PROFILE,
    })
    const spud = scored.findIndex((s) => s.adventure.id === 'old_lime_creek_spud')
    const ice = scored.findIndex((s) => s.adventure.id === 'ice_lake_basin_day')
    expect(spud).toBeLessThan(ice)
  })

  it('flags routes that exceed the profile ceilings', () => {
    const scored = scoreAdventures({
      mode: null,
      constraints: constraints(),
      profile: { ...DEFAULT_PROFILE, maxGainFt: 1000, maxElevationFt: 10000 },
    })
    const ice = scored.find((s) => s.adventure.id === 'ice_lake_basin_day')
    expect(ice?.blockers.join(' ')).toContain('ceiling')
  })

  it('rewards 4WD routes only when the user actually wants them', () => {
    const keen = scoreAdventures({
      mode: null,
      constraints: constraints(),
      profile: { ...DEFAULT_PROFILE, offroad: 3 },
    })
    const not = scoreAdventures({
      mode: null,
      constraints: constraints(),
      profile: { ...DEFAULT_PROFILE, offroad: 0 },
    })
    const scoreOf = (list: typeof keen, id: string) =>
      list.find((s) => s.adventure.id === id)?.score ?? 0
    expect(scoreOf(keen, 'kennebec_pass_bronco')).toBeGreaterThan(
      scoreOf(not, 'kennebec_pass_bronco'),
    )
  })

  it('stops repeating an adventure done recently', () => {
    const fresh = scoreAdventures({
      mode: 'big_day',
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    const repeated = scoreAdventures({
      mode: 'big_day',
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
      recentIds: [fresh[0].adventure.id],
    })
    expect(repeated[0].adventure.id).not.toBe(fresh[0].adventure.id)
  })
})

describe("dealer's choice", () => {
  it('picks from the top of the list', () => {
    const scored = scoreAdventures({
      mode: null,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    const pick = dealersChoice(scored, () => 0)
    expect(pick?.adventure.id).toBe(
      scored.filter((s) => s.blockers.length === 0)[0].adventure.id,
    )
  })

  it('varies with the random draw', () => {
    const scored = scoreAdventures({
      mode: null,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    const first = dealersChoice(scored, () => 0)?.adventure.id
    const later = dealersChoice(scored, () => 0.99)?.adventure.id
    expect(first).not.toBe(later)
  })

  it('avoids blocked routes when a clean one exists', () => {
    const winter = scoreAdventures({
      mode: null,
      constraints: constraints({ date: '2026-01-15' }),
      profile: DEFAULT_PROFILE,
    })
    const pick = dealersChoice(winter, () => 0.5)
    if (winter.some((s) => s.blockers.length === 0)) {
      expect(pick?.blockers).toHaveLength(0)
    }
  })

  it('returns null rather than throwing on an empty list', () => {
    expect(dealersChoice([], () => 0)).toBeNull()
  })
})
