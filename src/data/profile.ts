import type { ExperienceProfile, PlanConstraints } from './types'

/**
 * Starting point, not an assumption about what anyone can do. Everything here
 * is editable in the app, and the app always shows the route's real numbers
 * next to these so the user decides rather than the defaults deciding.
 */
export const DEFAULT_PROFILE: ExperienceProfile = {
  hikeMiles: { min: 3, max: 9 },
  maxGainFt: 3000,
  maxElevationFt: 13000,
  maxDriveMinutes: 180,
  technicalTerrain: 2,
  offroad: 3,
  remoteness: 2,
  camping: 2,
  foodImportance: 2,
  interests: ['scenery', 'history', 'hiking', 'offroad'],
  preferredDepth: ['half_day', 'full_day', 'big_day'],
  paceMph: 2.2,
  financeMode: true,
}

export function defaultConstraints(isoDate: string): PlanConstraints {
  return {
    date: isoDate,
    earliestDeparture: 8 * 60,
    homeByMinutes: 18 * 60 + 30,
    maxDriveMinutes: 180,
    hikeAppetite: 'moderate',
    food: 'brewery',
    interests: [],
    modes: [],
  }
}

/** Local ISO date (YYYY-MM-DD) without dragging in a timezone library. */
export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return todayIso(date)
}
