import type { Itinerary, PlanConstraints } from '../data/types'
import type { LogEntry } from '../engine/log'
import { readJson, writeJson } from './storage'

export interface SavedTrip {
  id: string
  savedAt: number
  adventureId: string
  name: string
  constraints: PlanConstraints
  itinerary: Itinerary
  /** Ticked-off gear ids, shared between both phones via nothing at all. */
  packed: string[]
  /** "We're doing this." */
  confirmed: boolean
  notes: string
}

const TRIPS_KEY = 'trips'
const LOG_KEY = 'log'

export function loadTrips(): SavedTrip[] {
  const raw = readJson<unknown>(TRIPS_KEY, [])
  return Array.isArray(raw) ? raw.filter(isSavedTrip) : []
}

export function saveTrips(trips: SavedTrip[]): void {
  writeJson(TRIPS_KEY, trips)
}

export function loadLog(): LogEntry[] {
  const raw = readJson<unknown>(LOG_KEY, [])
  return Array.isArray(raw) ? raw.filter(isLogEntry) : []
}

export function saveLog(entries: LogEntry[]): void {
  writeJson(LOG_KEY, entries)
}

/**
 * Stored data outlives the code that wrote it. Anything that does not still
 * look like a trip is dropped rather than crashing the screen that renders it.
 */
export function isSavedTrip(value: unknown): value is SavedTrip {
  if (typeof value !== 'object' || value === null) return false
  const trip = value as Partial<SavedTrip>
  return (
    typeof trip.id === 'string' &&
    typeof trip.adventureId === 'string' &&
    typeof trip.name === 'string' &&
    typeof trip.itinerary === 'object' &&
    trip.itinerary !== null &&
    Array.isArray((trip.itinerary as Itinerary).legs)
  )
}

export function isLogEntry(value: unknown): value is LogEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Partial<LogEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.name === 'string' &&
    Array.isArray(entry.foodIds)
  )
}

export function upsertTrip(trips: SavedTrip[], trip: SavedTrip): SavedTrip[] {
  const index = trips.findIndex((t) => t.id === trip.id)
  if (index === -1) return [trip, ...trips]
  const next = [...trips]
  next[index] = trip
  return next
}

export function removeTrip(trips: SavedTrip[], id: string): SavedTrip[] {
  return trips.filter((t) => t.id !== id)
}

/**
 * What a saved trip can still tell you with no signal. Everything listed in
 * `needsNetwork` is deliberately absent rather than shown stale and unlabelled.
 */
export interface OfflineCapability {
  available: string[]
  needsNetwork: string[]
}

export function offlineCapability(trip: SavedTrip): OfflineCapability {
  const available = [
    'Full itinerary with times',
    'Destination name and coordinates',
    'Route summary and road requirements',
    'Packing checklist',
    'Hazards and access notes',
  ]
  if (trip.itinerary.hikeId) available.push('Hike distance, gain and high point')
  if (trip.itinerary.campId) available.push('Campsite access and restrictions')

  return {
    available,
    needsNetwork: [
      'Live weather forecast',
      'Current road closures and fire restrictions',
      'Turn-by-turn navigation',
      'Brewery hours',
    ],
  }
}

export function newTripId(now: number = Date.now()): string {
  return `trip_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
