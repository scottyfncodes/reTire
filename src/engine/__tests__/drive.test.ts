import { describe, expect, it } from 'vitest'
import type { DriveSegment } from '../../data/types'
import {
  estimateDrive,
  estimateRoundTrip,
  hardestVehicle,
  meetsVehicle,
  segmentMinutes,
} from '../drive'
import { high, mid } from '../measure'

const base = { sources: ['test'], lastChecked: '2026-09-18' }

const paved: DriveSegment = {
  ...base,
  via: 'US 550 north',
  miles: 48,
  roadClass: 'paved_mountain',
  vehicle: 'any_vehicle',
}

const gravel: DriveSegment = {
  ...base,
  via: 'FR 585',
  miles: 6.4,
  roadClass: 'graded_dirt',
  vehicle: 'any_vehicle',
}

const technical: DriveSegment = {
  ...base,
  via: 'Up to Engineer Pass',
  miles: null,
  roadClass: 'technical_4wd',
  vehicle: 'four_wd_low_range',
}

describe('segment timing', () => {
  it('uses the speed model when only distance is known', () => {
    const { minutes, sourced } = segmentMinutes(paved)
    expect(sourced).toBe(false)
    expect(mid(minutes)).toBeCloseTo(72) // 48 mi at 40 mph
  })

  it('prefers a published travel time over the model', () => {
    const parkRoad: DriveSegment = {
      ...base,
      via: 'Park entrance road',
      miles: { min: 20, max: 22 },
      roadClass: 'paved_mountain',
      vehicle: 'any_vehicle',
      minutesOverride: { min: 40, max: 45 },
    }
    const { minutes, sourced } = segmentMinutes(parkRoad)
    expect(sourced).toBe(true)
    // The model would say ~32 min for 21 miles; the park says 40-45.
    expect(minutes).toEqual({ min: 40, max: 45 })
  })

  it('returns unknown rather than a guess when distance is unsourced', () => {
    expect(segmentMinutes(technical).minutes).toBeNull()
  })

  it('is slower on rough ground than on pavement for the same distance', () => {
    const rough: DriveSegment = { ...paved, roadClass: 'technical_4wd', miles: 10 }
    const smooth: DriveSegment = { ...paved, roadClass: 'paved_highway', miles: 10 }
    expect(mid(segmentMinutes(rough).minutes) as number).toBeGreaterThan(
      mid(segmentMinutes(smooth).minutes) as number,
    )
  })
})

describe('route estimates', () => {
  it('adds the legs it can and counts the ones it cannot', () => {
    const estimate = estimateDrive([paved, gravel, technical])
    expect(estimate.unmeasuredLegs).toBe(1)
    expect(estimate.fullySourced).toBe(false)
    expect(estimate.miles).toBe(54.4)
    expect(mid(estimate.minutes)).toBeCloseTo(72 + (6.4 / 22) * 60)
  })

  it('reports the hardest vehicle requirement on the route', () => {
    expect(estimateDrive([paved, gravel, technical]).vehicle).toBe(
      'four_wd_low_range',
    )
    expect(estimateDrive([paved, gravel]).vehicle).toBe('any_vehicle')
  })

  it('doubles an out-and-back route', () => {
    const oneWay = estimateDrive([paved, gravel])
    const round = estimateRoundTrip([paved, gravel])
    expect(round.miles).toBeCloseTo((oneWay.miles as number) * 2)
    expect(high(round.minutes) as number).toBeCloseTo(
      (high(oneWay.minutes) as number) * 2,
    )
  })

  it('uses a different return route when one is given', () => {
    const round = estimateRoundTrip([paved], [gravel])
    expect(round.miles).toBeCloseTo(54.4)
  })

  it('survives an empty route', () => {
    const estimate = estimateDrive([])
    expect(estimate.minutes).toBeNull()
    expect(estimate.vehicle).toBe('any_vehicle')
    expect(estimate.unmeasuredLegs).toBe(0)
  })
})

describe('vehicle requirements', () => {
  it('ranks requirements so the truck covers the easier roads', () => {
    expect(hardestVehicle(['any_vehicle', 'four_wd'])).toBe('four_wd')
    expect(hardestVehicle(['four_wd_low_range', 'high_clearance'])).toBe(
      'four_wd_low_range',
    )
    expect(hardestVehicle([])).toBe('any_vehicle')
  })

  it('treats an unverified road as harder than a known easy one', () => {
    expect(hardestVehicle(['any_vehicle', 'unknown'])).toBe('unknown')
    expect(hardestVehicle(['unknown', 'four_wd'])).toBe('four_wd')
  })

  it('never claims a vehicle satisfies an unknown requirement', () => {
    expect(meetsVehicle('four_wd_low_range', 'unknown')).toBe(false)
    expect(meetsVehicle('four_wd_low_range', 'four_wd')).toBe(true)
    expect(meetsVehicle('high_clearance', 'four_wd')).toBe(false)
  })
})
