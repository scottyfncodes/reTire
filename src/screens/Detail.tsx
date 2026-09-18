import { useMemo, useState } from 'react'
import { ADVENTURES_BY_ID, HOME } from '../data/adventures'
import { CAMPS_BY_ID } from '../data/camps'
import { FOOD_BY_ID } from '../data/food'
import { HIKES_BY_ID } from '../data/hikes'
import { STOPS_BY_ID } from '../data/stops'
import type { Itinerary } from '../data/types'
import { buildItinerary, formatDurationRange } from '../engine/itinerary'
import { estimateHike } from '../engine/hike'
import { DEPTH_BLURB, DEPTH_LABEL } from '../engine/depth'
import { ROAD_CLASS_LABEL, VEHICLE_LABEL } from '../engine/drive'
import { formatMeasure, high } from '../engine/measure'
import { formatClock, formatDuration } from '../engine/time'
import { formatSeasonMonths } from '../engine/season'
import { measureToLogged } from '../engine/log'
import { newTripId, offlineCapability, type SavedTrip } from '../services/trips'
import { useStore } from '../state/store'
import { useWeather } from '../state/useWeather'
import { WeatherPanel } from '../components/WeatherPanel'
import { Timeline } from '../components/Timeline'
import { Memo } from '../components/Memo'
import { GearChecklist } from '../components/GearChecklist'
import { QuickControls } from './Results'
import {
  navigateUrl,
  SectionTitle,
  SourceLine,
  Stat,
  WarningList,
} from '../components/Bits'

export function Detail({
  id,
  go,
  tripId,
}: {
  id: string
  go: (path: string) => void
  tripId?: string
}) {
  const store = useStore()
  const { constraints, setConstraints, profile, trips, saveTrip, addLogEntry } =
    store

  const adventure = ADVENTURES_BY_ID[id]
  const existing = tripId ? trips.find((t) => t.id === tripId) : undefined

  const [hikeId, setHikeId] = useState<string | null | undefined>(
    existing?.itinerary.hikeId,
  )
  const [foodId, setFoodId] = useState<string | null | undefined>(
    existing?.itinerary.foodId,
  )
  const [campId, setCampId] = useState<string | null | undefined>(undefined)
  const [overnight, setOvernight] = useState(
    existing?.itinerary.overnight ??
      Boolean(adventure?.modes.includes('overnighter')),
  )
  const [showMemo, setShowMemo] = useState(profile.financeMode)
  const [editing, setEditing] = useState(false)
  const [packed, setPacked] = useState<string[]>(existing?.packed ?? [])
  const [saved, setSaved] = useState<string | null>(tripId ?? null)

  const anchorElevation = useMemo(() => {
    if (!adventure) return null
    const hike = adventure.hikeIds.map((h) => HIKES_BY_ID[h]).find(Boolean)
    return high(hike?.highPointFt ?? null) ?? null
  }, [adventure])

  const weather = useWeather(
    adventure?.anchor.lat ?? null,
    adventure?.anchor.lon ?? null,
    anchorElevation,
  )

  const daylight = useMemo(() => {
    const day = weather.data?.daily.find((d) => d.date === constraints.date)
    if (!day || day.sunrise === null || day.sunset === null) return null
    return { sunrise: day.sunrise, sunset: day.sunset }
  }, [weather.data, constraints.date])

  const itinerary = useMemo(() => {
    if (!adventure) return null
    return buildItinerary({
      adventure,
      constraints,
      profile,
      hikeId,
      foodId,
      campId,
      overnight,
      daylight,
    })
  }, [adventure, constraints, profile, hikeId, foodId, campId, overnight, daylight])

  if (!adventure || !itinerary) {
    return (
      <div>
        <button type="button" className="backlink" onClick={() => go('')}>
          ← Home
        </button>
        <p className="muted">That adventure is not in the dataset.</p>
      </div>
    )
  }

  const hike = itinerary.hikeId ? HIKES_BY_ID[itinerary.hikeId] : null
  const food = itinerary.foodId ? FOOD_BY_ID[itinerary.foodId] : null
  const camp = itinerary.campId ? CAMPS_BY_ID[itinerary.campId] : null

  const persist = (confirmed: boolean) => {
    const trip: SavedTrip = {
      id: saved ?? newTripId(),
      savedAt: Date.now(),
      adventureId: adventure.id,
      name: adventure.name,
      constraints,
      itinerary,
      packed,
      confirmed,
      notes: existing?.notes ?? '',
    }
    saveTrip(trip)
    setSaved(trip.id)
    return trip
  }

  const logIt = () => {
    addLogEntry({
      id: `log_${Date.now().toString(36)}`,
      date: constraints.date,
      adventureId: adventure.id,
      name: adventure.name,
      driveMiles: measureToLogged(itinerary.driveMiles),
      hikeMiles: measureToLogged(itinerary.hikeMiles),
      gainFt: measureToLogged(itinerary.gainFt),
      overnight: itinerary.overnight,
      foodIds: itinerary.foodId ? [itinerary.foodId] : [],
      notes: '',
      favorite: false,
    })
    go('log')
  }

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <div className="chips" style={{ marginBottom: 10 }}>
        <span className="chip chip--depth">{DEPTH_LABEL[itinerary.depth]}</span>
        <span
          className={
            itinerary.vehicle === 'unknown' ? 'chip chip--unknown' : 'chip chip--truck'
          }
        >
          {VEHICLE_LABEL[itinerary.vehicle]}
        </span>
        <span className="chip">{formatSeasonMonths(adventure.season)}</span>
      </div>

      <h1 className="display">{adventure.name}</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {adventure.region} · {adventure.tagline}
      </p>
      <p className="tiny faint">{DEPTH_BLURB[itinerary.depth]}</p>

      <Numbers itinerary={itinerary} />

      <SectionTitle>Why this one</SectionTitle>
      <p className="muted">{adventure.why}</p>
      <ul className="tiny muted" style={{ paddingLeft: 18 }}>
        {adventure.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>

      {itinerary.warnings.length > 0 && (
        <>
          <SectionTitle>Before you commit</SectionTitle>
          <WarningList warnings={itinerary.warnings} />
        </>
      )}

      <SectionTitle>The day</SectionTitle>
      <Timeline itinerary={itinerary} />

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setEditing((e) => !e)}
      >
        {editing ? 'Done modifying' : 'Modify the plan'}
      </button>

      {editing && (
        <div className="card card--flat" style={{ marginTop: 12 }}>
          <QuickControls constraints={constraints} onChange={setConstraints} />

          {adventure.hikeIds.length > 0 && (
            <Picker
              label="Hike"
              value={hikeId === undefined ? itinerary.hikeId : hikeId}
              options={[
                { value: null, label: 'No hike' },
                ...adventure.hikeIds.map((h) => ({
                  value: h,
                  label: HIKES_BY_ID[h].name,
                })),
              ]}
              onChange={setHikeId}
            />
          )}

          {adventure.foodIds.length > 0 && (
            <Picker
              label="Food & beer"
              value={foodId === undefined ? itinerary.foodId : foodId}
              options={[
                { value: null, label: 'Skip it' },
                ...adventure.foodIds
                  .filter((f) => FOOD_BY_ID[f].closed === null)
                  .map((f) => ({ value: f, label: FOOD_BY_ID[f].name })),
              ]}
              onChange={setFoodId}
            />
          )}

          {adventure.campIds.length > 0 && (
            <>
              <Picker
                label="Campsite"
                value={campId === undefined ? itinerary.campId : campId}
                options={adventure.campIds.map((c) => ({
                  value: c,
                  label: CAMPS_BY_ID[c].name,
                }))}
                onChange={setCampId}
              />
              <button
                type="button"
                className="btn"
                onClick={() => setOvernight((o) => !o)}
              >
                {overnight ? 'Make it a day trip' : 'Make it an overnighter'}
              </button>
            </>
          )}
        </div>
      )}

      <SectionTitle>Weather at the destination</SectionTitle>
      <WeatherPanel
        state={weather}
        isoDate={constraints.date}
        elevationFt={anchorElevation}
        place={adventure.anchor.label}
      />

      <SectionTitle>What the road asks for</SectionTitle>
      {adventure.outbound.map((segment, i) => (
        <div key={i} className="card card--flat">
          <div className="eyebrow">Leg {i + 1}</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
            {segment.via}
          </h3>
          <div className="chips" style={{ margin: '8px 0' }}>
            <span className="chip">
              {formatMeasure(segment.miles, 'mi', { decimals: 1 })}
            </span>
            <span className="chip">{ROAD_CLASS_LABEL[segment.roadClass]}</span>
            <span
              className={
                segment.vehicle === 'unknown' ? 'chip chip--unknown' : 'chip chip--truck'
              }
            >
              {VEHICLE_LABEL[segment.vehicle]}
            </span>
          </div>
          {segment.notes && (
            <p className="tiny muted" style={{ margin: '0 0 8px' }}>
              {segment.notes}
            </p>
          )}
          <SourceLine ids={segment.sources} lastChecked={segment.lastChecked} />
        </div>
      ))}
      <p className="tiny faint">
        Current closures are not in this app. Check{' '}
        <a href="https://www.cotrip.org/" target="_blank" rel="noreferrer noopener">
          COtrip
        </a>{' '}
        for the highways and the land manager for the forest roads on the day
        you go.
      </p>

      {hike && (
        <>
          <SectionTitle>The hike</SectionTitle>
          <div className="card">
            <h3 className="headline">{hike.name}</h3>
            {hike.trailNumber && (
              <p className="tiny faint" style={{ marginTop: 2 }}>
                {hike.trailNumber}
              </p>
            )}
            <div className="stats">
              <Stat label="Distance" value={hike.miles} unit="mi" decimals={1} />
              <Stat label="Gain" value={hike.gainFt} unit="ft" />
              <Stat label="Trailhead" value={hike.trailheadFt} unit="ft" />
              <Stat label="High point" value={hike.highPointFt} unit="ft" />
            </div>
            <p className="tiny muted" style={{ marginBottom: 6 }}>
              Estimated{' '}
              {formatDurationRange(
                estimateHike(hike, profile.paceMph).minutesWithBreaks,
              )}{' '}
              at your {profile.paceMph} mph pace, including breaks and a
              thin-air allowance. That is a model, not a measurement.
            </p>
            <Line label="Trail type" value={shapeLabel(hike.shape)} />
            <Line
              label="Rated difficulty"
              value={hike.ratedDifficulty ?? 'Not published by the land manager'}
            />
            <Line label="Season" value={formatSeasonMonths(hike.season)} />
            <Line label="Wilderness" value={hike.wilderness ?? 'None'} />
            <Line label="Permits" value={hike.permits ?? 'None recorded'} />
            <Line label="Dogs" value={dogLabel(hike.dogs)} />
            <Line
              label="Parking"
              value={hike.parking.notes ?? 'UNKNOWN'}
            />
            <Line
              label="Parking spaces"
              value={formatMeasure(hike.parking.spaces)}
            />
            <Line
              label="Final approach"
              value={VEHICLE_LABEL[hike.parking.finalApproach]}
            />
            {hike.hazards.length > 0 && (
              <>
                <div className="eyebrow" style={{ marginTop: 12 }}>
                  Hazards
                </div>
                <ul className="tiny muted" style={{ paddingLeft: 18 }}>
                  {hike.hazards.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </>
            )}
            <SourceLine ids={hike.sources} lastChecked={hike.lastChecked} />
          </div>
        </>
      )}

      {adventure.stopIds.length > 0 && (
        <>
          <SectionTitle>Worth stopping for</SectionTitle>
          {adventure.stopIds.map((sid) => {
            const stop = STOPS_BY_ID[sid]
            return (
              <div key={sid} className="card card--flat">
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{stop.name}</h3>
                <p className="tiny muted" style={{ margin: '6px 0' }}>
                  {stop.blurb}
                </p>
                <div className="chips" style={{ marginBottom: 8 }}>
                  <span className="chip">
                    {formatMeasure(stop.elevationFt, 'ft')}
                  </span>
                  {stop.dwellMinutes && (
                    <span className="chip">
                      about {formatDuration(stop.dwellMinutes)}
                    </span>
                  )}
                </div>
                <SourceLine ids={stop.sources} lastChecked={stop.lastChecked} />
              </div>
            )
          })}
        </>
      )}

      {camp && (
        <>
          <SectionTitle>Camp</SectionTitle>
          <div className="card">
            <h3 className="headline">{camp.name}</h3>
            <div className="chips" style={{ margin: '8px 0' }}>
              <span className="chip">
                {camp.kind === 'dispersed' ? 'Dispersed' : 'Developed'}
              </span>
              <span className="chip">{VEHICLE_LABEL[camp.access]}</span>
              <span className="chip">{reservationLabel(camp.reservations)}</span>
            </div>
            <div className="stats">
              <Stat label="Elevation" value={camp.elevationFt} unit="ft" />
              <Stat label="Sites" value={camp.sites} />
              <Stat label="Fee" value={camp.feeUsd} unit="USD" />
            </div>
            <Line label="Season" value={formatSeasonMonths(camp.season)} />
            <Line label="Water" value={camp.water ?? 'UNKNOWN'} />
            <Line
              label="Rooftop tent"
              value={camp.rooftopTentNotes ?? 'UNKNOWN'}
            />
            {camp.restrictions.length > 0 && (
              <ul className="tiny muted" style={{ paddingLeft: 18 }}>
                {camp.restrictions.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <div className="warn warn--caution" style={{ marginTop: 10 }}>
              <span className="warn__mark">!</span>
              <span>
                A spot appearing here does not make it legal to camp in. The
                signs at the road junction and the current fire restrictions are
                the authority.{' '}
                <a
                  href="https://dfpc.colorado.gov/fire-restrictions-and-bans"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Check restrictions
                </a>
                .
              </span>
            </div>
            <SourceLine ids={camp.sources} lastChecked={camp.lastChecked} />
          </div>
        </>
      )}

      {food && (
        <>
          <SectionTitle>Refuel</SectionTitle>
          <div className="card card--flat">
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>{food.name}</h3>
            <p className="tiny muted" style={{ margin: '4px 0' }}>
              {food.town}
              {food.address ? ` · ${food.address}` : ''}
            </p>
            <p className="tiny" style={{ color: 'var(--caution)' }}>
              {food.hoursNote ?? 'Hours not verified.'} Hours change constantly —
              this app does not treat them as fact.
            </p>
            <div className="chips">
              {food.url && (
                <a className="chip" href={food.url} target="_blank" rel="noreferrer noopener">
                  Website
                </a>
              )}
              {food.phone && (
                <a className="chip" href={`tel:${food.phone}`}>
                  {food.phone}
                </a>
              )}
            </div>
            <SourceLine ids={food.sources} lastChecked={food.lastChecked} />
          </div>
        </>
      )}

      <SectionTitle>Navigate</SectionTitle>
      <div className="card card--flat">
        <div className="eyebrow">Navigation to the trailhead</div>
        <p className="tiny muted" style={{ margin: '4px 0 10px' }}>
          Hands off to your maps app for the drive to{' '}
          {adventure.anchor.label}. Coordinates are approximate — sanity-check
          them against the route before you rely on them.
        </p>
        <a
          className="btn btn--primary"
          href={navigateUrl(
            adventure.anchor.lat,
            adventure.anchor.lon,
            adventure.anchor.label,
          )}
          target="_blank"
          rel="noreferrer noopener"
        >
          Navigate · {adventure.anchor.lat.toFixed(4)},{' '}
          {adventure.anchor.lon.toFixed(4)}
        </a>
        <hr className="rule" />
        <div className="eyebrow">Trail / backcountry route</div>
        <p className="tiny muted" style={{ margin: '4px 0 0' }}>
          Not provided here, and not something to rely on a phone for. Most of
          this country has no cell service — carry a downloaded offline map or
          paper, and treat the drive-to-trailhead link above as the limit of
          what this app navigates.
        </p>
      </div>

      <SectionTitle>Packing</SectionTitle>
      <GearChecklist
        itinerary={itinerary}
        packed={packed}
        onToggle={(gid) =>
          setPacked((p) => (p.includes(gid) ? p.filter((x) => x !== gid) : [...p, gid]))
        }
      />

      {profile.financeMode && (
        <>
          <SectionTitle>For the finance guy</SectionTitle>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ marginBottom: 12 }}
            onClick={() => setShowMemo((s) => !s)}
          >
            {showMemo ? 'Hide the memo' : 'Read it as an investment memo'}
          </button>
          {showMemo && <Memo adventure={adventure} itinerary={itinerary} />}
        </>
      )}

      <SectionTitle>Offline</SectionTitle>
      <OfflineNote itinerary={itinerary} />

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => persist(false)}>
          {saved ? 'Update saved' : 'Save this plan'}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            persist(true)
            go('trips')
          }}
        >
          We're doing this
        </button>
      </div>
      <button type="button" className="btn btn--ghost" style={{ marginTop: 10 }} onClick={logIt}>
        Log it as done
      </button>

      <div style={{ marginTop: 18 }}>
        <SourceLine
          ids={adventure.sources}
          lastChecked={adventure.lastChecked}
          prefix="Adventure sources"
        />
      </div>
    </div>
  )
}

function Numbers({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="grid-3" style={{ margin: '18px 0' }}>
      <Box
        value={formatDuration(itinerary.driveMinutes)}
        label={`Driving${itinerary.unmeasuredLegs > 0 ? ' (floor)' : ''}`}
      />
      <Box value={formatMeasure(itinerary.driveMiles, 'mi')} label="Road miles" />
      <Box
        value={formatMeasure(itinerary.hikeMiles, 'mi', { decimals: 1 })}
        label="On foot"
      />
      <Box value={formatMeasure(itinerary.gainFt, 'ft')} label="Elevation gain" />
      <Box
        value={formatMeasure(itinerary.maxElevationFt, 'ft')}
        label="High point"
      />
      <Box
        value={
          itinerary.overnight
            ? 'Overnight'
            : formatClock(itinerary.homeMinutes)
        }
        label={itinerary.overnight ? 'Out all night' : 'Home by'}
      />
    </div>
  )
}

function Box({ value, label }: { value: string; label: string }) {
  return (
    <div className="bigstat">
      <div
        className="bigstat__value"
        style={value === 'UNKNOWN' ? { fontSize: 14, color: 'var(--caution)' } : undefined}
      >
        {value}
      </div>
      <div className="bigstat__label">{label}</div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="tiny" style={{ margin: '0 0 6px' }}>
      <span className="faint" style={{ letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </span>
      <br />
      <span className={value === 'UNKNOWN' ? '' : 'muted'} style={value === 'UNKNOWN' ? { color: 'var(--caution)' } : undefined}>
        {value}
      </span>
    </p>
  )
}

function Picker<T extends string | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (next: T) => void
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="seg">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className="seg__btn"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function OfflineNote({ itinerary }: { itinerary: Itinerary }) {
  const capability = offlineCapability({
    id: 'preview',
    savedAt: 0,
    adventureId: itinerary.adventureId,
    name: '',
    constraints: {} as never,
    itinerary,
    packed: [],
    confirmed: false,
    notes: '',
  })
  return (
    <div className="card card--flat">
      <p className="tiny muted" style={{ marginTop: 0 }}>
        Save this plan and the following stay available with no signal:
      </p>
      <ul className="tiny muted" style={{ paddingLeft: 18 }}>
        {capability.available.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p className="tiny" style={{ color: 'var(--caution)', marginBottom: 0 }}>
        Still needs a signal: {capability.needsNetwork.join(', ').toLowerCase()}.
      </p>
    </div>
  )
}

function shapeLabel(shape: string): string {
  switch (shape) {
    case 'out_and_back':
      return 'Out and back'
    case 'loop':
      return 'Loop'
    case 'point_to_point':
      return 'Point to point'
    case 'partly_off_trail':
      return 'Trail, then off-trail to finish'
    default:
      return 'UNKNOWN'
  }
}

function dogLabel(policy: string): string {
  switch (policy) {
    case 'leash':
      return 'On leash'
    case 'under_control':
      return 'Under control'
    case 'prohibited':
      return 'Not allowed'
    default:
      return 'UNKNOWN — check with the land manager'
  }
}

function reservationLabel(policy: string): string {
  switch (policy) {
    case 'first_come':
      return 'First come, first served'
    case 'reservable':
      return 'Reservable'
    case 'mixed':
      return 'Mixed'
    case 'none_required':
      return 'No reservation'
    default:
      return 'UNKNOWN'
  }
}

export { HOME }
