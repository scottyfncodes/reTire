import type { Measure } from '../data/types'
import { high, low, mid } from './measure'

export interface LogEntry {
  id: string
  date: string
  adventureId: string | null
  name: string
  driveMiles: number | null
  hikeMiles: number | null
  gainFt: number | null
  overnight: boolean
  foodIds: string[]
  notes: string
  favorite: boolean
}

export interface LogStats {
  adventures: number
  milesDriven: number
  milesHiked: number
  elevationGained: number
  nightsOut: number
  breweries: number
  favorites: number
}

export function summarize(entries: LogEntry[]): LogStats {
  const breweries = new Set<string>()
  let milesDriven = 0
  let milesHiked = 0
  let elevationGained = 0
  let nightsOut = 0
  let favorites = 0

  for (const entry of entries) {
    milesDriven += entry.driveMiles ?? 0
    milesHiked += entry.hikeMiles ?? 0
    elevationGained += entry.gainFt ?? 0
    if (entry.overnight) nightsOut += 1
    if (entry.favorite) favorites += 1
    for (const id of entry.foodIds) breweries.add(id)
  }

  return {
    adventures: entries.length,
    milesDriven: Math.round(milesDriven),
    milesHiked: Math.round(milesHiked * 10) / 10,
    elevationGained: Math.round(elevationGained),
    nightsOut,
    breweries: breweries.size,
    favorites,
  }
}

/**
 * The log records what happened, so a range is no use here -- but neither is
 * inventing precision. We take the midpoint of a range and keep null as null,
 * so an unmeasured day contributes nothing rather than a guess.
 */
export function measureToLogged(m: Measure): number | null {
  const value = mid(m)
  if (value === null) return null
  return Math.round(value * 10) / 10
}

/** Ids done within `days` of `isoDate`, newest data first. */
export function recentAdventureIds(
  entries: LogEntry[],
  isoDate: string,
  days = 30,
): string[] {
  const cutoff = new Date(isoDate).getTime() - days * 24 * 60 * 60 * 1000
  return entries
    .filter((e) => e.adventureId !== null && new Date(e.date).getTime() >= cutoff)
    .map((e) => e.adventureId as string)
}

export { high, low }
