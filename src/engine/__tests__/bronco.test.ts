import { describe, expect, it } from 'vitest'
import { ADVENTURES_BY_ID } from '../../data/adventures'
import { DEFAULT_PROFILE, defaultConstraints } from '../../data/profile'
import type { Adventure, Itinerary } from '../../data/types'
import { buildItinerary } from '../itinerary'
import { broncoRouteContext, BRONCO_CAPABILITY } from '../bronco'

const CONSTRAINTS = defaultConstraints('2026-07-15')

function planFor(id: string): { adventure: Adventure; itinerary: Itinerary } {
  const adventure = ADVENTURES_BY_ID[id]
  const itinerary = buildItinerary({ adventure, constraints: CONSTRAINTS, profile: DEFAULT_PROFILE })
  return { adventure, itinerary }
}

describe('Bronco route context', () => {
  it('the Bronco Sasquatch capability is the top vehicle class', () => {
    // The whole "meets the stated requirement" comparison depends on this.
    expect(BRONCO_CAPABILITY).toBe('four_wd_low_range')
  })

  it('marks high clearance and 4WD irrelevant on an any-vehicle route', () => {
    const { adventure, itinerary } = planFor('animas_mountain_quick')
    const ctx = broncoRouteContext(adventure, itinerary)
    expect(ctx.requirement).toBe('any_vehicle')
    expect(ctx.highClearanceRelevant).toBe(false)
    expect(ctx.fourWdRelevant).toBe(false)
    expect(ctx.meetsStatedRequirement).toBe(true)
  })

  it('marks 4WD relevant and confirms capability on a 4WD-low-range route', () => {
    const { adventure, itinerary } = planFor('alpine_loop_engineer')
    const ctx = broncoRouteContext(adventure, itinerary)
    expect(ctx.requirement).toBe('four_wd_low_range')
    expect(ctx.highClearanceRelevant).toBe(true)
    expect(ctx.fourWdRelevant).toBe(true)
    expect(ctx.meetsStatedRequirement).toBe(true)
  })

  it('marks high clearance relevant without necessarily requiring 4WD', () => {
    const { adventure, itinerary } = planFor('old_lime_creek_spud')
    const ctx = broncoRouteContext(adventure, itinerary)
    expect(ctx.requirement).toBe('high_clearance')
    expect(ctx.highClearanceRelevant).toBe(true)
    expect(ctx.fourWdRelevant).toBe(false)
    expect(ctx.meetsStatedRequirement).toBe(true)
  })

  it('never asserts capability against a route whose own requirement is unknown', () => {
    const { adventure, itinerary } = planFor('ophir_pass_crossing')
    // Every current route in the dataset happens to state a requirement, so
    // force the unknown case directly rather than assert it never occurs.
    const unknownItinerary: Itinerary = { ...itinerary, vehicle: 'unknown' }
    const ctx = broncoRouteContext(adventure, unknownItinerary)
    expect(ctx.meetsStatedRequirement).toBeNull()
  })

  it('surfaces the route’s own sourced hazards as considerations, inventing nothing new', () => {
    const { adventure, itinerary } = planFor('highland_mary_lakes_day')
    const ctx = broncoRouteContext(adventure, itinerary)
    expect(ctx.considerations).toEqual(adventure.hazards)
  })

  it('reports the road classes actually present on the outbound route', () => {
    const { adventure, itinerary } = planFor('kennebec_pass_bronco')
    const ctx = broncoRouteContext(adventure, itinerary)
    expect(ctx.roadClasses.length).toBeGreaterThan(0)
    expect(new Set(ctx.roadClasses).size).toBe(ctx.roadClasses.length)
  })
})
