import { describe, expect, it } from 'vitest'
import { ADVENTURES } from './adventures'
import { CAMPS, CAMPS_BY_ID } from './camps'
import { FOOD, FOOD_BY_ID, OPEN_FOOD } from './food'
import { HIKES, HIKES_BY_ID } from './hikes'
import { SOURCES, trustOf } from './sources'
import { STOPS, STOPS_BY_ID } from './stops'
import type { Measure, Sourced } from './types'
import { high, low } from '../engine/measure'

const ALL_SOURCED: Array<{ what: string; record: Sourced }> = [
  ...HIKES.map((h) => ({ what: `hike ${h.id}`, record: h })),
  ...HIKES.map((h) => ({ what: `hike ${h.id} parking`, record: h.parking })),
  ...HIKES.map((h) => ({ what: `hike ${h.id} season`, record: h.season })),
  ...CAMPS.map((c) => ({ what: `camp ${c.id}`, record: c })),
  ...CAMPS.map((c) => ({ what: `camp ${c.id} season`, record: c.season })),
  ...FOOD.map((f) => ({ what: `food ${f.id}`, record: f })),
  ...STOPS.map((s) => ({ what: `stop ${s.id}`, record: s })),
  ...ADVENTURES.map((a) => ({ what: `adventure ${a.id}`, record: a })),
  ...ADVENTURES.flatMap((a) =>
    a.outbound.map((seg, i) => ({
      what: `adventure ${a.id} leg ${i}`,
      record: seg,
    })),
  ),
]

describe('provenance', () => {
  it('every record cites at least one source', () => {
    for (const { what, record } of ALL_SOURCED) {
      expect(record.sources.length, `${what} has no sources`).toBeGreaterThan(0)
    }
  })

  it('every cited source is one we actually know about', () => {
    for (const { what, record } of ALL_SOURCED) {
      for (const id of record.sources) {
        expect(SOURCES[id], `${what} cites unknown source "${id}"`).toBeDefined()
      }
    }
  })

  it('every record carries a check date', () => {
    for (const { what, record } of ALL_SOURCED) {
      expect(record.lastChecked, `${what} has no check date`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      )
    }
  })

  it('every source has a working-looking URL and an owning organisation', () => {
    for (const source of Object.values(SOURCES)) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.org.length).toBeGreaterThan(0)
    }
  })

  it('reports the strongest kind of source backing a fact', () => {
    expect(trustOf(['alltrails', 'sjnf'])).toBe('agency')
    expect(trustOf(['alltrails'])).toBe('community')
    expect(trustOf([])).toBe('none')
    expect(trustOf(['not_a_source'])).toBe('none')
  })
})

describe('referential integrity', () => {
  it('every adventure points at hikes, stops, camps and food that exist', () => {
    for (const adventure of ADVENTURES) {
      for (const id of adventure.hikeIds) {
        expect(HIKES_BY_ID[id], `${adventure.id} -> hike ${id}`).toBeDefined()
      }
      for (const id of adventure.stopIds) {
        expect(STOPS_BY_ID[id], `${adventure.id} -> stop ${id}`).toBeDefined()
      }
      for (const id of adventure.campIds) {
        expect(CAMPS_BY_ID[id], `${adventure.id} -> camp ${id}`).toBeDefined()
      }
      for (const id of adventure.foodIds) {
        expect(FOOD_BY_ID[id], `${adventure.id} -> food ${id}`).toBeDefined()
      }
    }
  })

  it('has unique ids across each dataset', () => {
    const unique = (ids: string[]) => new Set(ids).size === ids.length
    expect(unique(ADVENTURES.map((a) => a.id))).toBe(true)
    expect(unique(HIKES.map((h) => h.id))).toBe(true)
    expect(unique(CAMPS.map((c) => c.id))).toBe(true)
    expect(unique(FOOD.map((f) => f.id))).toBe(true)
    expect(unique(STOPS.map((s) => s.id))).toBe(true)
  })

  it('never offers a non-active business as an adventure’s only food option', () => {
    for (const adventure of ADVENTURES) {
      if (adventure.foodIds.length === 0) continue
      const open = adventure.foodIds.filter((id) => FOOD_BY_ID[id].status === 'active')
      expect(open.length, `${adventure.id} has no active food option`).toBeGreaterThan(
        0,
      )
    }
  })

  it('covers every adventure mode with at least one route', () => {
    const modes = new Set(ADVENTURES.flatMap((a) => a.modes))
    for (const mode of [
      'big_day',
      'fourwd',
      'day_trip',
      'overnighter',
      'explorer',
      'full_send',
    ]) {
      expect(modes.has(mode as never), `no route for mode ${mode}`).toBe(true)
    }
  })

  it('gives every overnighter somewhere to actually sleep', () => {
    for (const adventure of ADVENTURES) {
      if (!adventure.modes.includes('overnighter')) continue
      expect(adventure.campIds.length, `${adventure.id}`).toBeGreaterThan(0)
    }
  })
})

describe('measurement sanity', () => {
  const ordered = (m: Measure) => m === null || (low(m) as number) <= (high(m) as number)

  it('has no inverted or negative ranges', () => {
    for (const hike of HIKES) {
      expect(ordered(hike.miles), hike.id).toBe(true)
      expect(ordered(hike.gainFt), hike.id).toBe(true)
      expect((low(hike.miles) ?? 0) >= 0, hike.id).toBe(true)
    }
  })

  it('never puts a trail high point below its own trailhead', () => {
    for (const hike of HIKES) {
      const top = high(hike.highPointFt)
      const start = low(hike.trailheadFt)
      if (top === null || start === null) continue
      expect(top, hike.id).toBeGreaterThanOrEqual(start)
    }
  })

  it('keeps coordinates inside the Four Corners region', () => {
    const points = [
      ...HIKES.map((h) => ({ id: h.id, lat: h.lat, lon: h.lon })),
      ...CAMPS.map((c) => ({ id: c.id, lat: c.lat, lon: c.lon })),
      ...STOPS.map((s) => ({ id: s.id, lat: s.lat, lon: s.lon })),
      ...FOOD.map((f) => ({ id: f.id, lat: f.lat, lon: f.lon })),
      ...ADVENTURES.map((a) => ({ id: a.id, lat: a.anchor.lat, lon: a.anchor.lon })),
    ]
    for (const point of points) {
      expect(point.lat, point.id).toBeGreaterThan(36.5)
      expect(point.lat, point.id).toBeLessThan(38.5)
      expect(point.lon, point.id).toBeLessThan(-106.5)
      expect(point.lon, point.id).toBeGreaterThan(-109)
    }
  })
})

describe('honesty rules', () => {
  it('records a closure reason for anything not active', () => {
    for (const food of FOOD) {
      if (food.status === 'active') continue
      expect(
        food.closureReason !== null && food.closureReason.length > 0,
        `${food.id} is ${food.status} but has no closureReason`,
      ).toBe(true)
    }
  })

  it('does not present unverified hours as fact', () => {
    for (const food of FOOD) {
      if (food.status !== 'active') continue
      expect(
        food.hoursNote === null ||
          /not verified|confirm|call ahead|checked/i.test(food.hoursNote),
        `${food.id} states hours without qualifying them`,
      ).toBe(true)
    }
  })

  it('attaches a note to every season window, including the unknown ones', () => {
    for (const hike of HIKES) expect(hike.season.note.length).toBeGreaterThan(0)
    for (const camp of CAMPS) expect(camp.season.note.length).toBeGreaterThan(0)
    for (const adventure of ADVENTURES) {
      expect(adventure.season.note.length).toBeGreaterThan(0)
    }
  })

  it('tells dispersed campers the signs on the ground are the authority', () => {
    for (const camp of CAMPS) {
      if (camp.kind !== 'dispersed') continue
      expect(
        camp.restrictions.join(' ').toLowerCase(),
        `${camp.id} does not defer to the land manager`,
      ).toMatch(/sign|verify|check|do not assume/)
    }
  })
})

describe('business status model', () => {
  const STATUSES = ['active', 'seasonal', 'temporarily_closed', 'permanently_closed', 'unknown']

  it('gives every business one of the explicit statuses', () => {
    for (const food of FOOD) {
      expect(STATUSES, food.id).toContain(food.status)
    }
  })

  it('only ACTIVE businesses can ever be recommended', () => {
    expect(OPEN_FOOD.length).toBeGreaterThan(0)
    for (const food of OPEN_FOOD) {
      expect(food.status, food.id).toBe('active')
    }
  })

  it('excludes SEASONAL, TEMPORARILY_CLOSED, PERMANENTLY_CLOSED and UNKNOWN from OPEN_FOOD', () => {
    for (const food of FOOD) {
      if (food.status === 'active') continue
      expect(
        OPEN_FOOD.some((f) => f.id === food.id),
        `${food.id} is ${food.status} but appears in OPEN_FOOD`,
      ).toBe(false)
    }
  })

  it('keeps Avalanche Brewing permanently closed and unrecommendable, generically -- not as a special case', () => {
    const avalanche = FOOD_BY_ID['avalanche_silverton']
    expect(avalanche.status).toBe('permanently_closed')
    expect(avalanche.closureReason).not.toBeNull()
    expect(OPEN_FOOD.some((f) => f.id === 'avalanche_silverton')).toBe(false)
  })

  it('carries a verification source and a verification date for every business', () => {
    for (const food of FOOD) {
      expect(food.sources.length, `${food.id} has no verification source`).toBeGreaterThan(0)
      expect(food.lastChecked, `${food.id} has no verification date`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      )
    }
  })
})
