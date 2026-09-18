import { describe, expect, it } from 'vitest'
import type { Itinerary } from '../data/types'
import {
  isLogEntry,
  isSavedTrip,
  loadLog,
  loadTrips,
  newTripId,
  offlineCapability,
  removeTrip,
  upsertTrip,
  type SavedTrip,
} from './trips'
import { measureToLogged, recentAdventureIds, summarize, type LogEntry } from '../engine/log'

const itinerary = (over: Partial<Itinerary> = {}): Itinerary =>
  ({
    adventureId: 'ice_lake_basin_day',
    date: '2026-07-15',
    legs: [],
    departMinutes: 480,
    homeMinutes: 1100,
    driveMinutes: 160,
    hikeMinutes: 320,
    totalMinutes: 620,
    driveMiles: 108,
    hikeMiles: { min: 7.4, max: 8.5 },
    gainFt: 2400,
    maxElevationFt: 12400,
    depth: 'big_day',
    vehicle: 'any_vehicle',
    overnight: false,
    unmeasuredLegs: 0,
    warnings: [],
    hikeId: 'ice_lake_basin',
    foodId: 'steamworks',
    campId: null,
    ...over,
  }) as Itinerary

const trip = (over: Partial<SavedTrip> = {}): SavedTrip =>
  ({
    id: 'trip_1',
    savedAt: 0,
    adventureId: 'ice_lake_basin_day',
    name: 'Ice Lake Basin',
    constraints: {} as SavedTrip['constraints'],
    itinerary: itinerary(),
    packed: [],
    confirmed: false,
    notes: '',
    ...over,
  }) as SavedTrip

describe('saved adventures', () => {
  it('adds a new trip to the front of the list', () => {
    const list = upsertTrip([trip({ id: 'a' })], trip({ id: 'b' }))
    expect(list.map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('replaces a trip in place rather than duplicating it', () => {
    const list = upsertTrip(
      [trip({ id: 'a', notes: 'old' }), trip({ id: 'b' })],
      trip({ id: 'a', notes: 'new' }),
    )
    expect(list).toHaveLength(2)
    expect(list[0].notes).toBe('new')
  })

  it('removes by id and leaves the rest alone', () => {
    const list = removeTrip([trip({ id: 'a' }), trip({ id: 'b' })], 'a')
    expect(list.map((t) => t.id)).toEqual(['b'])
    expect(removeTrip(list, 'nope')).toHaveLength(1)
  })

  it('mints unique ids', () => {
    expect(newTripId(1)).not.toBe(newTripId(1))
  })
})

describe('reading back stored data', () => {
  it('rejects anything that no longer looks like a trip', () => {
    expect(isSavedTrip(trip())).toBe(true)
    expect(isSavedTrip(null)).toBe(false)
    expect(isSavedTrip('trip')).toBe(false)
    expect(isSavedTrip({ id: 'x' })).toBe(false)
    expect(isSavedTrip({ ...trip(), itinerary: null })).toBe(false)
    expect(isSavedTrip({ ...trip(), itinerary: { legs: 'nope' } })).toBe(false)
  })

  it('rejects a malformed log entry', () => {
    expect(isLogEntry({ id: 'a', date: '2026-07-15', name: 'x', foodIds: [] })).toBe(
      true,
    )
    expect(isLogEntry({ id: 'a', date: '2026-07-15', name: 'x' })).toBe(false)
    expect(isLogEntry(undefined)).toBe(false)
  })

  it('returns empty lists when storage is unavailable entirely', () => {
    // No localStorage in this environment at all -- the same situation as a
    // locked-down browser. It must degrade, not throw.
    expect(loadTrips()).toEqual([])
    expect(loadLog()).toEqual([])
  })
})

describe('offline state', () => {
  it('lists what a saved trip still answers with no signal', () => {
    const capability = offlineCapability(trip())
    expect(capability.available).toContain('Full itinerary with times')
    expect(capability.available).toContain('Hike distance, gain and high point')
    expect(capability.available).toContain('Packing checklist')
  })

  it('is explicit about what still needs the network', () => {
    const capability = offlineCapability(trip())
    expect(capability.needsNetwork).toContain('Live weather forecast')
    expect(capability.needsNetwork).toContain('Brewery hours')
    expect(capability.needsNetwork).toContain(
      'Current road closures and fire restrictions',
    )
  })

  it('only offers campsite detail when the trip actually has one', () => {
    expect(offlineCapability(trip()).available).not.toContain(
      'Campsite access and restrictions',
    )
    const overnighter = trip({
      itinerary: itinerary({ campId: 'south_mineral_dispersed', overnight: true }),
    })
    expect(offlineCapability(overnighter).available).toContain(
      'Campsite access and restrictions',
    )
  })
})

describe('adventure log', () => {
  const entry = (over: Partial<LogEntry> = {}): LogEntry => ({
    id: 'e1',
    date: '2026-07-15',
    adventureId: 'ice_lake_basin_day',
    name: 'Ice Lake Basin',
    driveMiles: 108,
    hikeMiles: 8,
    gainFt: 2400,
    overnight: false,
    foodIds: ['steamworks'],
    notes: '',
    favorite: false,
    ...over,
  })

  it('adds up the stats', () => {
    const stats = summarize([
      entry(),
      entry({ id: 'e2', driveMiles: 40, hikeMiles: 3.5, gainFt: 900, overnight: true }),
    ])
    expect(stats.adventures).toBe(2)
    expect(stats.milesDriven).toBe(148)
    expect(stats.milesHiked).toBe(11.5)
    expect(stats.elevationGained).toBe(3300)
    expect(stats.nightsOut).toBe(1)
  })

  it('counts each brewery once however often you go', () => {
    const stats = summarize([
      entry(),
      entry({ id: 'e2', foodIds: ['steamworks', 'ska'] }),
    ])
    expect(stats.breweries).toBe(2)
  })

  it('treats an unrecorded number as nothing, not as zero-with-confidence', () => {
    const stats = summarize([entry({ driveMiles: null, hikeMiles: null, gainFt: null })])
    expect(stats.milesDriven).toBe(0)
    expect(stats.adventures).toBe(1)
  })

  it('handles an empty log', () => {
    expect(summarize([])).toEqual({
      adventures: 0,
      milesDriven: 0,
      milesHiked: 0,
      elevationGained: 0,
      nightsOut: 0,
      breweries: 0,
      favorites: 0,
    })
  })

  it('logs the midpoint of a range and keeps unknown as unknown', () => {
    expect(measureToLogged({ min: 7.4, max: 8.5 })).toBe(8)
    expect(measureToLogged(12)).toBe(12)
    expect(measureToLogged(null)).toBeNull()
  })

  it('finds what was done recently so it stops being suggested', () => {
    const recent = recentAdventureIds(
      [
        entry({ date: '2026-07-10' }),
        entry({ id: 'old', date: '2026-01-01', adventureId: 'mesa_verde_day' }),
      ],
      '2026-07-15',
      30,
    )
    expect(recent).toEqual(['ice_lake_basin_day'])
  })
})
