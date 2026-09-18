import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ExperienceProfile, PlanConstraints } from '../data/types'
import { DEFAULT_PROFILE, defaultConstraints, todayIso } from '../data/profile'
import { readJson, writeJson } from '../services/storage'
import {
  loadLog,
  loadTrips,
  removeTrip as removeTripFrom,
  saveLog,
  saveTrips,
  upsertTrip,
  type SavedTrip,
} from '../services/trips'
import type { LogEntry } from '../engine/log'

interface Store {
  profile: ExperienceProfile
  setProfile: (next: ExperienceProfile) => void
  constraints: PlanConstraints
  setConstraints: (next: PlanConstraints) => void
  trips: SavedTrip[]
  saveTrip: (trip: SavedTrip) => void
  removeTrip: (id: string) => void
  log: LogEntry[]
  addLogEntry: (entry: LogEntry) => void
  removeLogEntry: (id: string) => void
  online: boolean
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ExperienceProfile>(() =>
    readJson('profile', DEFAULT_PROFILE),
  )
  const [constraints, setConstraintsState] = useState<PlanConstraints>(() => {
    const stored = readJson<PlanConstraints | null>('constraints', null)
    const base = defaultConstraints(todayIso())
    // The saved date is yesterday's business; the rest of the shape is not.
    return stored ? { ...base, ...stored, date: base.date } : base
  })
  const [trips, setTrips] = useState<SavedTrip[]>(() => loadTrips())
  const [log, setLog] = useState<LogEntry[]>(() => loadLog())
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const setProfile = useCallback((next: ExperienceProfile) => {
    setProfileState(next)
    writeJson('profile', next)
  }, [])

  const setConstraints = useCallback((next: PlanConstraints) => {
    setConstraintsState(next)
    writeJson('constraints', next)
  }, [])

  const saveTrip = useCallback((trip: SavedTrip) => {
    setTrips((current) => {
      const next = upsertTrip(current, trip)
      saveTrips(next)
      return next
    })
  }, [])

  const removeTrip = useCallback((id: string) => {
    setTrips((current) => {
      const next = removeTripFrom(current, id)
      saveTrips(next)
      return next
    })
  }, [])

  const addLogEntry = useCallback((entry: LogEntry) => {
    setLog((current) => {
      const next = [entry, ...current.filter((e) => e.id !== entry.id)]
      saveLog(next)
      return next
    })
  }, [])

  const removeLogEntry = useCallback((id: string) => {
    setLog((current) => {
      const next = current.filter((e) => e.id !== id)
      saveLog(next)
      return next
    })
  }, [])

  const value = useMemo<Store>(
    () => ({
      profile,
      setProfile,
      constraints,
      setConstraints,
      trips,
      saveTrip,
      removeTrip,
      log,
      addLogEntry,
      removeLogEntry,
      online,
    }),
    [
      profile,
      setProfile,
      constraints,
      setConstraints,
      trips,
      saveTrip,
      removeTrip,
      log,
      addLogEntry,
      removeLogEntry,
      online,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
