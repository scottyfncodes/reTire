import { describe, expect, it } from 'vitest'
import {
  BRONCO_BREAKOVER,
  BRONCO_DASHBOARD,
  BRONCO_FACTORY_EQUIPMENT,
  BRONCO_FACTORY_RECOVERY,
  BRONCO_PERSONAL_RECOVERY_GEAR,
  BRONCO_RANGE_ESTIMATE,
  CHEAT_SHEET,
  GOAT_MODES,
  PRE_ADVENTURE_CHECKLIST,
  ROOF_TENT_PHASES,
  TIRE_INFO,
} from './bronco'
import { SOURCES } from './sources'
import type { BroncoMeasure, Sourced } from './types'
import { formatMeasure } from '../engine/measure'

const SOURCED_FACTS: Array<{ what: string; record: Sourced }> = [
  ...BRONCO_DASHBOARD.map((m) => ({ what: `dashboard fact ${m.id}`, record: m })),
  { what: 'breakover angle', record: BRONCO_BREAKOVER },
  { what: 'tire info', record: TIRE_INFO },
  ...GOAT_MODES.map((m) => ({ what: `G.O.A.T. mode ${m.id}`, record: m })),
]

describe('Bronco data schema', () => {
  it('every sourced Bronco fact cites at least one real source', () => {
    for (const { what, record } of SOURCED_FACTS) {
      expect(record.sources.length, `${what} has no sources`).toBeGreaterThan(0)
      for (const id of record.sources) {
        expect(SOURCES[id], `${what} cites unknown source "${id}"`).toBeDefined()
      }
    }
  })

  it('every sourced Bronco fact carries a check date', () => {
    for (const { what, record } of SOURCED_FACTS) {
      expect(record.lastChecked, `${what} has no check date`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('has unique, non-empty ids across the dashboard facts', () => {
    const ids = BRONCO_DASHBOARD.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const m of BRONCO_DASHBOARD) expect(m.id.length).toBeGreaterThan(0)
  })

  it('does not put the whole spec sheet on the landing dashboard', () => {
    // The dashboard is the landing card; deeper facts (breakover, range,
    // factory equipment) live behind the detail disclosure instead.
    expect(BRONCO_DASHBOARD.length).toBeLessThanOrEqual(8)
  })

  it('explains itself whenever a figure varies by configuration', () => {
    for (const m of [...BRONCO_DASHBOARD, BRONCO_BREAKOVER]) {
      if (m.variesBy.length === 0) continue
      expect(m.note.length, `${m.id} varies but has no explanatory note`).toBeGreaterThan(0)
    }
  })

  it('never asserts a single off-road tire pressure Ford does not publish', () => {
    expect(TIRE_INFO.offRoadPressureNote).toMatch(/does not publish/i)
  })

  it('defers to the vehicle’s own placard rather than inventing one pressure figure', () => {
    expect(TIRE_INFO.coldPressureNote.toLowerCase()).toMatch(/placard|door/)
  })

  it('renders UNKNOWN rather than guessing when a Bronco fact has no sourced value', () => {
    const noFigure: BroncoMeasure = {
      id: 'test_unknown',
      label: 'Unconfirmed figure',
      value: null,
      unit: 'in',
      variesBy: [],
      note: 'No credible source publishes this for the exact configuration.',
      sources: ['ford_bronco'],
      lastChecked: '2026-09-18',
    }
    expect(formatMeasure(noFigure.value, noFigure.unit)).toBe('UNKNOWN')
  })

  it('gives G.O.A.T. Modes unique ids and every required field filled in', () => {
    const ids = GOAT_MODES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const mode of GOAT_MODES) {
      expect(mode.name.length).toBeGreaterThan(0)
      expect(mode.standardOn.length).toBeGreaterThan(0)
      expect(mode.whatItDoes.length).toBeGreaterThan(0)
      expect(mode.bestFor.length).toBeGreaterThan(0)
      expect(mode.whenToUse.length).toBeGreaterThan(0)
      expect(mode.fieldNote.length).toBeGreaterThan(0)
    }
  })

  it('flags trim-dependent G.O.A.T. Modes instead of asserting they are on every truck', () => {
    const rockCrawl = GOAT_MODES.find((m) => m.id === 'rock_crawl')
    expect(rockCrawl).toBeDefined()
    expect(rockCrawl!.standardOn.toLowerCase()).toMatch(/badlands|check/i)
  })

  it('keeps the off-road cheat sheet to quick entries, not a driving textbook', () => {
    expect(CHEAT_SHEET.length).toBeGreaterThan(0)
    for (const entry of CHEAT_SHEET) {
      expect(entry.guidance.length).toBeLessThan(220)
    }
  })

  it('separates factory recovery equipment from recommended personal gear', () => {
    expect(BRONCO_FACTORY_RECOVERY.length).toBeGreaterThan(0)
    expect(BRONCO_PERSONAL_RECOVERY_GEAR.length).toBeGreaterThan(0)
    const factoryIds = new Set(BRONCO_FACTORY_RECOVERY.map((i) => i.id))
    const personalIds = new Set(BRONCO_PERSONAL_RECOVERY_GEAR.map((i) => i.id))
    for (const id of personalIds) expect(factoryIds.has(id)).toBe(false)
  })

  it('gives the roof tent checklist all three phases with real content', () => {
    const titles = ROOF_TENT_PHASES.map((p) => p.title.toLowerCase())
    expect(titles.some((t) => t.includes('before leaving'))).toBe(true)
    expect(titles.some((t) => t.includes('setting up'))).toBe(true)
    expect(titles.some((t) => t.includes('before driving away'))).toBe(true)
    for (const phase of ROOF_TENT_PHASES) expect(phase.items.length).toBeGreaterThan(0)
  })

  it('gives the pre-adventure checklist unique, non-empty items', () => {
    const ids = PRE_ADVENTURE_CHECKLIST.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(PRE_ADVENTURE_CHECKLIST.length).toBeGreaterThan(5)
  })

  it('lists factory equipment as plain confirmed statements, not marketing copy', () => {
    expect(BRONCO_FACTORY_EQUIPMENT.length).toBeGreaterThan(0)
    for (const item of BRONCO_FACTORY_EQUIPMENT) expect(item.length).toBeGreaterThan(0)
  })

  it('discloses the range estimate as a model, not a Ford-published figure', () => {
    expect(BRONCO_RANGE_ESTIMATE.note.toLowerCase()).toMatch(/estimat|epa/)
  })
})
