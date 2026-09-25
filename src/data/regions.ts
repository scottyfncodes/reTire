import type { Region } from './types'
import { ADVENTURES } from './adventures'
import { UTAH_DESTINATIONS } from './utah'

/**
 * The map of the app. Colorado is home -- the existing Durango planner, which
 * stays exactly as it was. Utah is where you go when a day trip is not enough.
 * A new region is one entry here plus its destinations; no new screens.
 */
export const REGIONS: Region[] = [
  {
    id: 'colorado',
    name: 'Colorado',
    state: 'CO',
    emoji: '🏔️',
    tagline: 'Durango day trips: passes, ghost towns, alpine lakes',
    home: true,
    conditions: ['cotrip', 'sjnf_alerts', 'fire_restrictions'],
  },
  {
    id: 'utah',
    name: 'Utah',
    state: 'UT',
    emoji: '🏜️',
    tagline: 'Moab and beyond: slickrock, dunes and desert backways',
    home: false,
    conditions: ['udot_traffic', 'utah_fire_info', 'utah_ohv_laws', 'blm_utah_rec'],
  },
]

export const REGIONS_BY_ID: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
)

export function destinationsIn(regionId: string) {
  // Flagship first, then the order the data was written in.
  return UTAH_DESTINATIONS.filter((d) => d.regionId === regionId).sort(
    (a, b) => Number(b.flagship) - Number(a.flagship),
  )
}

/** How many things there are to do in a region, for the switcher. */
export function regionCount(regionId: string): number {
  const region = REGIONS_BY_ID[regionId]
  if (!region) return 0
  return region.home ? ADVENTURES.length : destinationsIn(regionId).length
}
