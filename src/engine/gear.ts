import type { Itinerary } from '../data/types'
import { high } from './measure'

export interface GearItem {
  id: string
  label: string
  note?: string
}

export interface GearSection {
  title: string
  reason: string
  items: GearItem[]
}

const DAY_HIKE: GearItem[] = [
  { id: 'water', label: 'Water', note: 'Dry air at altitude costs more than you think' },
  { id: 'layers', label: 'Wind shell and warm layer' },
  { id: 'food', label: 'Food, plus something extra' },
  { id: 'nav', label: 'Map and compass, or a downloaded offline map' },
  { id: 'firstaid', label: 'First aid kit' },
  { id: 'headlamp', label: 'Headlamp' },
  { id: 'sun', label: 'Sun hat, glasses, high-SPF' },
]

const FOURWD: GearItem[] = [
  { id: 'recovery', label: 'Recovery gear: strap, shackles, gloves' },
  { id: 'compressor', label: 'Compressor and gauge', note: 'For airing back up at the pavement' },
  { id: 'traction', label: 'Traction boards' },
  { id: 'spare', label: 'Full-size spare, jack and a base plate for soft ground' },
  { id: 'tools', label: 'Basic tools and tyre plug kit' },
  { id: 'extrawater', label: 'Extra water in the truck' },
]

const OVERNIGHT: GearItem[] = [
  { id: 'rtt', label: 'Rooftop tent, ladder, and something to level on' },
  { id: 'sleep', label: 'Sleeping bags rated for the actual overnight low' },
  { id: 'cook', label: 'Stove, fuel, pot, water' },
  { id: 'light', label: 'Camp lighting and spare batteries' },
  { id: 'wc', label: 'Trowel or wag bag, per the land manager rules' },
]

const HIGH_ALTITUDE: GearItem[] = [
  { id: 'storm', label: 'Hard shell, not just a wind shell', note: 'Above treeline it rains sideways' },
  { id: 'gloves', label: 'Gloves and a warm hat' },
]

const REMOTE: GearItem[] = [
  { id: 'plb', label: 'Satellite messenger or PLB', note: 'No cell service on most of this' },
  { id: 'plan', label: 'Leave the plan with someone, with a turnaround time' },
]

/**
 * Trip-specific, derived from what the plan actually involves. Nothing here is
 * a survivalist fantasy -- if the day does not need it, it does not appear.
 */
export function buildGearList(itinerary: Itinerary): GearSection[] {
  const sections: GearSection[] = []

  if (itinerary.hikeId) {
    sections.push({
      title: 'Day hike',
      reason: `${Math.round(itinerary.hikeMinutes / 60)} hours or so on foot`,
      items: DAY_HIKE,
    })
  }

  const elevation = high(itinerary.maxElevationFt) ?? 0
  if (elevation >= 11000) {
    sections.push({
      title: 'Above treeline',
      reason: `Tops out around ${elevation.toLocaleString()} ft`,
      items: HIGH_ALTITUDE,
    })
  }

  if (itinerary.vehicle === 'four_wd' || itinerary.vehicle === 'four_wd_low_range') {
    sections.push({
      title: '4WD',
      reason: 'Part of this route needs the truck, not just the tyres',
      items: FOURWD,
    })
  }

  if (itinerary.overnight) {
    sections.push({
      title: 'Overnight',
      reason: 'Rooftop tent night',
      items: OVERNIGHT,
    })
  }

  if (
    itinerary.vehicle === 'four_wd_low_range' ||
    itinerary.overnight ||
    elevation >= 12000
  ) {
    sections.push({
      title: 'Out of contact',
      reason: 'Far enough out that help is slow',
      items: REMOTE,
    })
  }

  return sections
}
