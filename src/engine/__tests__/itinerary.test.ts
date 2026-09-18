import { describe, expect, it } from 'vitest'
import { ADVENTURES_BY_ID } from '../../data/adventures'
import { DEFAULT_PROFILE, defaultConstraints } from '../../data/profile'
import { FOOD_BY_ID } from '../../data/food'
import type { PlanConstraints } from '../../data/types'
import { buildItinerary } from '../itinerary'
import { formatClock } from '../time'

const SUMMER = '2026-07-15'
const NOVEMBER = '2026-11-15'

function constraints(overrides: Partial<PlanConstraints> = {}): PlanConstraints {
  return { ...defaultConstraints(SUMMER), ...overrides }
}

describe('itinerary shape', () => {
  it('starts by leaving home and ends by arriving home', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.legs[0].kind).toBe('depart')
    expect(plan.legs[plan.legs.length - 1].kind).toBe('arrive')
  })

  it('lays legs end to end with no gaps or overlaps', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    for (let i = 1; i < plan.legs.length; i += 1) {
      expect(plan.legs[i].startMinutes).toBe(plan.legs[i - 1].endMinutes)
      expect(plan.legs[i].endMinutes).toBeGreaterThanOrEqual(
        plan.legs[i].startMinutes,
      )
    }
  })

  it('departs exactly when told to', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.engineer_mountain_day,
      constraints: constraints({ earliestDeparture: 7 * 60 + 15 }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.departMinutes).toBe(435)
    expect(formatClock(plan.legs[0].startMinutes)).toBe('7:15 AM')
  })

  it('has a home time equal to departure plus every leg', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.old_lime_creek_spud,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    const legTotal = plan.legs.reduce(
      (sum, leg) => sum + (leg.endMinutes - leg.startMinutes),
      0,
    )
    expect(plan.homeMinutes).toBe(plan.departMinutes + legTotal)
    expect(plan.totalMinutes).toBe(legTotal)
  })

  it('counts drive and hike time separately from stops', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.driveMinutes).toBeGreaterThan(0)
    expect(plan.hikeMinutes).toBeGreaterThan(0)
    expect(plan.driveMinutes + plan.hikeMinutes).toBeLessThan(plan.totalMinutes)
  })
})

describe('return-home calculation', () => {
  it('warns when the plan overruns the home-by time', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({
        earliestDeparture: 10 * 60,
        homeByMinutes: 16 * 60,
      }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.homeMinutes).toBeGreaterThan(16 * 60)
    expect(plan.warnings.some((w) => w.message.includes('past your'))).toBe(true)
  })

  it('escalates a big overrun from caution to blocker', () => {
    // A route with no optional stops, so tightening the deadline cannot
    // change the plan's length and make the assertion circular.
    const adventure = ADVENTURES_BY_ID.hermosa_shoulder
    const roomy = buildItinerary({
      adventure,
      constraints: constraints({ earliestDeparture: 9 * 60, homeByMinutes: 23 * 60 }),
      profile: DEFAULT_PROFILE,
    })

    const withDeadline = (homeByMinutes: number) =>
      buildItinerary({
        adventure,
        constraints: constraints({ earliestDeparture: 9 * 60, homeByMinutes }),
        profile: DEFAULT_PROFILE,
      }).warnings
        .filter((w) => w.message.includes('past your'))
        .map((w) => w.level)

    // 30 minutes late is a nuisance; two hours late is a different plan.
    expect(withDeadline(roomy.homeMinutes - 30)).toEqual(['caution'])
    expect(withDeadline(roomy.homeMinutes - 120)).toEqual(['blocker'])
    expect(withDeadline(roomy.homeMinutes + 30)).toEqual([])
  })

  it('does not warn when the day comfortably fits', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.animas_mountain_quick,
      constraints: constraints({
        earliestDeparture: 7 * 60,
        homeByMinutes: 20 * 60,
      }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.warnings.some((w) => w.message.includes('past your'))).toBe(false)
  })

  it('flags a plan that runs past midnight', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({
        earliestDeparture: 21 * 60,
        homeByMinutes: 23 * 60 + 59,
      }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.warnings.some((w) => w.message.includes('past midnight'))).toBe(
      true,
    )
  })
})

describe('hike selection', () => {
  it('drops the hike entirely when the appetite is none', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ hikeAppetite: 'none' }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.hikeId).toBeNull()
    expect(plan.hikeMinutes).toBe(0)
    expect(plan.legs.some((l) => l.kind === 'hike')).toBe(false)
  })

  it('an explicit null hike beats the appetite setting', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ hikeAppetite: 'long' }),
      profile: DEFAULT_PROFILE,
      hikeId: null,
    })
    expect(plan.hikeId).toBeNull()
  })

  it('leaves a no-hike adventure without a hike leg', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.alpine_loop_engineer,
      constraints: constraints({ hikeAppetite: 'long' }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.hikeId).toBeNull()
    expect(plan.driveMinutes).toBeGreaterThan(0)
  })

  it('ignores a hike id that does not exist instead of throwing', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
      hikeId: 'no_such_hike',
    })
    expect(plan.hikeId).toBeNull()
  })
})

describe('food and beer integration', () => {
  it('puts a Durango brewery after the drive home', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ food: 'brewery' }),
      profile: DEFAULT_PROFILE,
    })
    const foodIndex = plan.legs.findIndex((l) => l.kind === 'food')
    const lastDrive = plan.legs.map((l) => l.kind).lastIndexOf('drive')
    expect(foodIndex).toBeGreaterThan(lastDrive)
    expect(FOOD_BY_ID[plan.foodId as string].town).toBe('Durango')
  })

  it('puts an out-of-town stop before the drive home', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.mesa_verde_day,
      constraints: constraints({ food: 'brewery' }),
      profile: DEFAULT_PROFILE,
      foodId: 'mancos_brewing',
    })
    const foodIndex = plan.legs.findIndex((l) => l.kind === 'food')
    const lastDrive = plan.legs.map((l) => l.kind).lastIndexOf('drive')
    expect(foodIndex).toBeLessThan(lastDrive)
  })

  it('never recommends a place known to have closed', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ food: 'brewery' }),
      profile: DEFAULT_PROFILE,
      foodId: 'avalanche_silverton',
    })
    expect(plan.foodId).toBeNull()
    expect(plan.legs.some((l) => l.kind === 'food')).toBe(false)
  })

  it('skips food when asked to', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ food: 'none' }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.foodId).toBeNull()
  })

  it('a longer sitting costs more of the day', () => {
    const lunch = buildItinerary({
      adventure: ADVENTURES_BY_ID.animas_mountain_quick,
      constraints: constraints({ food: 'lunch' }),
      profile: DEFAULT_PROFILE,
    })
    const dinner = buildItinerary({
      adventure: ADVENTURES_BY_ID.animas_mountain_quick,
      constraints: constraints({ food: 'dinner' }),
      profile: DEFAULT_PROFILE,
    })
    expect(dinner.totalMinutes).toBeGreaterThan(lunch.totalMinutes)
  })
})

describe('camping constraints', () => {
  it('ends at camp rather than at home on an overnighter', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.south_mineral_overnight,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
      overnight: true,
    })
    expect(plan.overnight).toBe(true)
    expect(plan.legs[plan.legs.length - 1].kind).toBe('camp')
    expect(plan.legs.some((l) => l.kind === 'arrive')).toBe(false)
    expect(plan.campId).toBe('south_mineral_dispersed')
  })

  it('does not apply the home-by check to an overnighter', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.south_mineral_overnight,
      constraints: constraints({ homeByMinutes: 12 * 60 }),
      profile: DEFAULT_PROFILE,
      overnight: true,
    })
    expect(plan.warnings.some((w) => w.message.includes('past your'))).toBe(false)
  })

  it('always says camping legality is decided on the ground', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.la_plata_overnight,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
      overnight: true,
    })
    expect(
      plan.warnings.some((w) => w.message.includes('signs at the site')),
    ).toBe(true)
  })

  it('counts an overnighter as an expedition', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.south_mineral_overnight,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
      overnight: true,
    })
    expect(plan.depth).toBe('expedition')
  })

  it('stays a day trip when overnight is requested but no campsite exists', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.chimney_rock_day,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
      overnight: true,
    })
    expect(plan.overnight).toBe(false)
    expect(plan.legs[plan.legs.length - 1].kind).toBe('arrive')
  })
})

describe('route requirements', () => {
  it('surfaces the hardest vehicle requirement on the whole plan', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.alpine_loop_engineer,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.vehicle).toBe('four_wd_low_range')
  })

  it('includes the trailhead approach road in that requirement', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.old_lime_creek_spud,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.vehicle).toBe('high_clearance')
  })

  it('reports unmeasured legs instead of quietly under-counting', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.alpine_loop_engineer,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.unmeasuredLegs).toBeGreaterThan(0)
    expect(plan.warnings.some((w) => w.message.includes('no sourced distance'))).toBe(
      true,
    )
  })

  it('does not raise that warning for a fully measured route', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.engineer_mountain_day,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.unmeasuredLegs).toBe(0)
  })
})

describe('profile ceilings', () => {
  it('flags a hike that climbs more than the profile allows', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints(),
      profile: { ...DEFAULT_PROFILE, maxGainFt: 1500 },
    })
    expect(plan.warnings.some((w) => w.message.includes('ceiling'))).toBe(true)
  })

  it('flags a route that tops out above the profile ceiling', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.alpine_loop_engineer,
      constraints: constraints(),
      profile: { ...DEFAULT_PROFILE, maxElevationFt: 11000 },
    })
    expect(plan.warnings.some((w) => w.message.includes('Tops out'))).toBe(true)
  })

  it('says nothing about ceilings the day stays under', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.animas_mountain_quick,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.warnings.some((w) => w.message.includes('ceiling'))).toBe(false)
  })
})

describe('seasonal awareness', () => {
  it('blocks a high-country route in November', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ date: NOVEMBER }),
      profile: DEFAULT_PROFILE,
    })
    expect(plan.warnings.some((w) => w.level === 'blocker')).toBe(true)
  })

  it('leaves a low-elevation route alone in November', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.hermosa_shoulder,
      constraints: constraints({ date: NOVEMBER }),
      profile: DEFAULT_PROFILE,
    })
    expect(
      plan.warnings.some(
        (w) => w.level === 'blocker' && w.message.includes('out of season'),
      ),
    ).toBe(false)
  })
})

describe('daylight', () => {
  it('warns when the walking finishes after sunset', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ earliestDeparture: 13 * 60 }),
      profile: DEFAULT_PROFILE,
      daylight: { sunrise: 6 * 60, sunset: 20 * 60 + 15 },
    })
    expect(plan.warnings.some((w) => w.message.includes('after sunset'))).toBe(
      true,
    )
  })

  it('mentions driving in the dark on an alpine start', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ earliestDeparture: 4 * 60 }),
      profile: DEFAULT_PROFILE,
      daylight: { sunrise: 6 * 60, sunset: 20 * 60 + 15 },
    })
    expect(plan.warnings.some((w) => w.message.includes('sunrise is'))).toBe(true)
  })

  it('says nothing about daylight when no forecast is available', () => {
    const plan = buildItinerary({
      adventure: ADVENTURES_BY_ID.ice_lake_basin_day,
      constraints: constraints({ earliestDeparture: 13 * 60 }),
      profile: DEFAULT_PROFILE,
      daylight: null,
    })
    expect(plan.warnings.some((w) => w.message.includes('sunset'))).toBe(false)
  })
})

describe('plan stability', () => {
  it('produces the same plan twice for the same inputs', () => {
    const args = {
      adventure: ADVENTURES_BY_ID.kennebec_pass_bronco,
      constraints: constraints(),
      profile: DEFAULT_PROFILE,
    }
    expect(buildItinerary(args)).toEqual(buildItinerary(args))
  })

  it('builds a plan for every adventure in the dataset without throwing', () => {
    for (const adventure of Object.values(ADVENTURES_BY_ID)) {
      const plan = buildItinerary({
        adventure,
        constraints: constraints(),
        profile: DEFAULT_PROFILE,
      })
      expect(plan.legs.length).toBeGreaterThan(1)
      expect(Number.isFinite(plan.homeMinutes)).toBe(true)
    }
  })
})
