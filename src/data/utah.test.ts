import { describe, expect, it } from 'vitest'
import { UTAH_DESTINATIONS, DESTINATIONS_BY_ID } from './utah'
import { REGIONS, REGIONS_BY_ID, destinationsIn, regionCount } from './regions'
import { ADVENTURES } from './adventures'
import { SOURCES } from './sources'
import type { Sourced } from './types'
import { high, low } from '../engine/measure'

const ALL_SOURCED: Array<{ what: string; record: Sourced }> = UTAH_DESTINATIONS.flatMap((d) => [
  { what: `destination ${d.id}`, record: d },
  { what: `destination ${d.id} season`, record: d.season },
  ...(d.fromDurango ? [{ what: `destination ${d.id} drive`, record: d.fromDurango }] : []),
  ...(d.skillsSchool ? [{ what: `destination ${d.id} school`, record: d.skillsSchool }] : []),
  ...d.routes.map((r) => ({ what: `route ${r.id}`, record: r })),
  ...d.camping.map((c) => ({ what: `${d.id} camp ${c.name}`, record: c })),
  ...d.fuel.map((f) => ({ what: `${d.id} fuel ${f.name}`, record: f })),
  ...d.food.map((f) => ({ what: `${d.id} food ${f.name}`, record: f })),
])

const ALL_ROUTES = UTAH_DESTINATIONS.flatMap((d) => d.routes)

describe('Utah provenance', () => {
  it('every Utah record cites at least one known source and a check date', () => {
    for (const { what, record } of ALL_SOURCED) {
      expect(record.sources.length, `${what} has no sources`).toBeGreaterThan(0)
      for (const id of record.sources) {
        expect(SOURCES[id], `${what} cites unknown source "${id}"`).toBeDefined()
      }
      expect(record.lastChecked, `${what} check date`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('every resource and published rating points at a real source', () => {
    for (const d of UTAH_DESTINATIONS) {
      expect(d.resources.length, d.id).toBeGreaterThan(0)
      for (const id of d.resources) expect(SOURCES[id], `${d.id} -> ${id}`).toBeDefined()
    }
    for (const r of ALL_ROUTES) {
      for (const p of r.published) expect(SOURCES[p.by], `${r.id} rated by ${p.by}`).toBeDefined()
    }
  })

  it('region live-condition links exist', () => {
    for (const region of REGIONS) {
      for (const id of region.conditions) expect(SOURCES[id], `${region.id} -> ${id}`).toBeDefined()
    }
  })
})

describe('Utah destinations', () => {
  it('has every destination in the brief', () => {
    for (const id of [
      'moab',
      'sand_hollow',
      'san_rafael_swell',
      'paiute_trail',
      'white_wash',
      'little_sahara',
      'kanab',
      'vernal',
    ]) {
      expect(DESTINATIONS_BY_ID[id], id).toBeDefined()
      expect(DESTINATIONS_BY_ID[id].regionId).toBe('utah')
    }
  })

  it('makes Moab the one flagship and lists it first', () => {
    expect(UTAH_DESTINATIONS.filter((d) => d.flagship).map((d) => d.id)).toEqual(['moab'])
    expect(destinationsIn('utah')[0].id).toBe('moab')
  })

  it('gives Moab the richest route list', () => {
    const moab = DESTINATIONS_BY_ID.moab
    for (const d of UTAH_DESTINATIONS) {
      if (d.id !== 'moab') expect(moab.routes.length).toBeGreaterThan(d.routes.length)
    }
  })

  it('covers the named Moab areas', () => {
    const moab = DESTINATIONS_BY_ID.moab
    const names = moab.routes.map((r) => r.name).join(' | ')
    for (const n of ["Hell's Revenge", 'Fins & Things', 'Poison Spider', 'Moab Rim', 'Kane Creek']) {
      expect(names, n).toContain(n)
    }
    expect(moab.camping.map((c) => c.name).join(' ')).toContain('Sand Flats')
  })

  it('gives Moab a route on every rung of the ladder', () => {
    const ratings = new Set(DESTINATIONS_BY_ID.moab.routes.map((r) => r.rating))
    expect(ratings.has('beginner')).toBe(true)
    expect(ratings.has('intermediate')).toBe(true)
    expect(ratings.has('advanced')).toBe(true)
  })

  it('treats the Paiute as a system, not one trail', () => {
    const paiute = DESTINATIONS_BY_ID.paiute_trail
    expect(paiute.styles).toContain('multi_day_ohv')
    expect(paiute.terrain).toContain('width_limits')
  })

  it('has unique ids', () => {
    const unique = (ids: string[]) => new Set(ids).size === ids.length
    expect(unique(UTAH_DESTINATIONS.map((d) => d.id))).toBe(true)
    expect(unique(ALL_ROUTES.map((r) => r.id))).toBe(true)
  })

  it('keeps every anchor inside Utah', () => {
    for (const d of UTAH_DESTINATIONS) {
      expect(d.anchor.lat, d.id).toBeGreaterThan(37)
      expect(d.anchor.lat, d.id).toBeLessThan(42)
      expect(d.anchor.lon, d.id).toBeGreaterThan(-114.05)
      expect(d.anchor.lon, d.id).toBeLessThan(-109.04)
    }
  })

  it('has a note and a season window (or an honest UNKNOWN) everywhere', () => {
    for (const d of UTAH_DESTINATIONS) {
      expect(d.season.note.length, d.id).toBeGreaterThan(0)
      if (d.season.months === null) expect(d.season.confidence).toBe('unknown')
    }
  })

  it('has no inverted ranges in drive or route figures', () => {
    for (const d of UTAH_DESTINATIONS) {
      for (const m of [d.fromDurango?.miles ?? null, d.fromDurango?.minutes ?? null]) {
        if (m !== null) expect(low(m)! <= high(m)!, d.id).toBe(true)
      }
    }
    for (const r of ALL_ROUTES) {
      if (r.miles !== null) expect(low(r.miles)! > 0, r.id).toBe(true)
    }
  })
})

describe('route honesty', () => {
  it('every route has a classification, a reason for it, and hazards', () => {
    for (const r of ALL_ROUTES) {
      expect(['beginner', 'intermediate', 'advanced', 'unknown']).toContain(r.rating)
      expect(r.ratingBasis.length, r.id).toBeGreaterThan(20)
      expect(r.hazards.length, `${r.id} lists no hazards`).toBeGreaterThan(0)
    }
  })

  it('only puts a colour on a route someone actually rated', () => {
    for (const r of ALL_ROUTES) {
      if (r.rating === 'unknown') continue
      expect(r.published.length, `${r.id} is coloured without a published rating`).toBeGreaterThan(0)
    }
  })

  it('never labels a route Beginner while asking for a built rig', () => {
    for (const r of ALL_ROUTES) {
      if (r.rating === 'beginner') {
        expect(['standard_suv', 'high_clearance', 'four_wd'], r.id).toContain(r.rig)
      }
      if (r.rating === 'advanced') {
        expect(['four_wd', 'advanced_4wd', 'specialized'], r.id).toContain(r.rig)
      }
    }
  })

  it('warns about water on every route with crossings or clay', () => {
    for (const r of ALL_ROUTES) {
      if (!r.features.includes('mud_when_wet') && !r.features.includes('water_crossings')) continue
      expect(r.hazards.join(' ').toLowerCase(), r.id).toMatch(/wet|flood|rain|deep|storm|quicksand/)
    }
  })

  it('hands off to maps by name, never by an invented coordinate', () => {
    for (const r of ALL_ROUTES) {
      expect(r.mapQuery.length, r.id).toBeGreaterThan(3)
      expect(r.mapQuery, r.id).not.toMatch(/-?\d+\.\d+\s*,\s*-?\d+\.\d+/)
      if (r.officialUrl) expect(r.officialUrl).toMatch(/^https:\/\//)
    }
  })
})

describe('Utah honesty rules', () => {
  it('tells dispersed campers the rules on the ground win', () => {
    for (const d of UTAH_DESTINATIONS) {
      for (const c of d.camping) {
        if (c.kind !== 'dispersed') continue
        expect(c.note.toLowerCase(), `${d.id} ${c.name}`).toMatch(/\bsigns?\b|verify|check|designated|prohibited/)
      }
    }
  })

  it('never states restaurant hours as fact', () => {
    for (const d of UTAH_DESTINATIONS) {
      for (const f of d.food) {
        if (/\bhours?\b/i.test(f.note)) {
          expect(f.note, `${d.id} ${f.name}`).toMatch(/not verified|confirm|seasonal|check/i)
        }
        expect(f.note, `${d.id} ${f.name} gives clock times`).not.toMatch(/\d{1,2}(:\d{2})?\s*(am|pm)/i)
      }
    }
  })
})

describe('regions', () => {
  it('keeps Colorado as the home region and Utah as the new chapter', () => {
    expect(REGIONS.map((r) => r.id)).toEqual(['colorado', 'utah'])
    expect(REGIONS_BY_ID.colorado.home).toBe(true)
    expect(REGIONS_BY_ID.utah.home).toBe(false)
    expect(regionCount('colorado')).toBe(ADVENTURES.length)
    expect(regionCount('utah')).toBe(UTAH_DESTINATIONS.length)
    expect(regionCount('nowhere')).toBe(0)
  })
})

describe('Colorado is untouched', () => {
  it('still has exactly the Durango adventures it had before Utah', () => {
    expect(ADVENTURES.map((a) => a.id)).toEqual([
      'ice_lake_basin_day',
      'alpine_loop_engineer',
      'engineer_mountain_day',
      'crater_lake_weminuche',
      'highland_mary_lakes_day',
      'kennebec_pass_bronco',
      'ophir_pass_crossing',
      'chimney_rock_day',
      'mesa_verde_day',
      'old_lime_creek_spud',
      'south_mineral_overnight',
      'la_plata_overnight',
      'hermosa_shoulder',
      'animas_mountain_quick',
    ])
  })

  it('keeps Utah out of the Durango day-trip engine', () => {
    const utahIds = new Set(UTAH_DESTINATIONS.map((d) => d.id))
    for (const a of ADVENTURES) expect(utahIds.has(a.id)).toBe(false)
  })
})
