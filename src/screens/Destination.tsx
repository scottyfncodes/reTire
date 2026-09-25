import { useState } from 'react'
import { DESTINATIONS_BY_ID } from '../data/utah'
import { REGIONS_BY_ID } from '../data/regions'
import { sourcesFor } from '../data/sources'
import type { Destination, PlaceNote } from '../data/types'
import {
  difficultyRange,
  FEATURE_META,
  formatDifficultyRange,
  LADDER_META,
  ladder,
  rigVerdict,
  RIG_SHORT,
  STYLE_LABEL,
} from '../engine/offroad'
import { formatMeasure } from '../engine/measure'
import { formatSeasonMonths } from '../engine/season'
import { formatDurationRange } from '../engine/itinerary'
import { useStore } from '../state/store'
import { useWeather } from '../state/useWeather'
import { WeatherPanel } from '../components/WeatherPanel'
import { RouteCard } from '../components/RouteCard'
import { navigateUrl, SectionTitle, SourceLine } from '../components/Bits'

export function DestinationScreen({ id, go }: { id: string; go: (path: string) => void }) {
  const { profile, constraints } = useStore()
  const destination = DESTINATIONS_BY_ID[id]
  const [openRoute, setOpenRoute] = useState<string | null>(null)
  const weather = useWeather(
    destination?.anchor.lat ?? null,
    destination?.anchor.lon ?? null,
    null,
  )

  if (!destination) {
    return (
      <div>
        <button type="button" className="backlink" onClick={() => go('region/utah')}>
          ← Utah
        </button>
        <p className="muted">That destination is not in the app.</p>
      </div>
    )
  }

  const region = REGIONS_BY_ID[destination.regionId]
  const range = difficultyRange(destination.routes)
  const drive = destination.fromDurango
  const rig = profile.rig
  const rigName = rig.name.trim() || 'your rig'
  const school = destination.skillsSchool
  const meets = destination.routes.filter((r) => rigVerdict(rig, r).fit === 'meets').length

  return (
    <div>
      <button
        type="button"
        className="backlink"
        onClick={() => go(`region/${destination.regionId}`)}
      >
        ← {region?.name ?? 'Back'}
      </button>

      <header className={`dest-hero dest-hero--${destination.id}`}>
        <span className="dest-hero__emoji" aria-hidden="true">
          {destination.emoji}
        </span>
        {destination.flagship && <div className="eyebrow dest-card__flag">Flagship</div>}
        <h1 className="display">{destination.name}</h1>
        <p className="muted" style={{ margin: '4px 0 10px' }}>
          📍 {destination.area}
        </p>
        <div className="chips">
          <span className="chip chip--depth">{formatDifficultyRange(range)}</span>
          <span className="chip">{formatSeasonMonths(destination.season)}</span>
          {drive && (
            <span className="chip">
              🚙 {formatDurationRange(drive.minutes)} from Durango
            </span>
          )}
        </div>
      </header>

      <SectionTitle>Why go</SectionTitle>
      <p className="muted">{destination.why}</p>
      <p className="tiny faint">{destination.tagline}</p>

      <SectionTitle>Terrain</SectionTitle>
      <p className="muted">{destination.feel}</p>
      <div className="chips">
        {destination.terrain.map((f) => (
          <span key={f} className="chip">
            {FEATURE_META[f].emoji} {FEATURE_META[f].label}
          </span>
        ))}
        {destination.styles.map((s) => (
          <span key={s} className="chip chip--truck">
            {STYLE_LABEL[s]}
          </span>
        ))}
      </div>

      {school ? (
        <>
          <SectionTitle>🐎 {school.name} → next adventure</SectionTitle>
          <div className="card school">
            <h2 className="headline">You learned the basics.</h2>
            <p className="muted" style={{ margin: '6px 0 10px' }}>
              Now where do you want to take the {rigName}?
            </p>
            <p className="tiny muted">{school.note}</p>
            <div className="warn warn--caution">
              <span className="warn__mark" aria-hidden="true">
                !
              </span>
              <span>
                This is a way to find the next thing, not a qualification. A
                school day teaches technique on a managed course; it does not
                make any particular trail right for you. Every route carries its
                own rating, hazards and who published them.
              </span>
            </div>
            <SourceLine ids={school.sources} lastChecked={school.lastChecked} />
          </div>
        </>
      ) : (
        <SectionTitle>Routes</SectionTitle>
      )}

      {ladder(destination.routes).map(({ step, routes }) => (
        <section key={step} className="ladder" aria-label={LADDER_META[step].title}>
          <h3 className="ladder__title">
            {LADDER_META[step].title}
          </h3>
          <p className="tiny faint" style={{ margin: '0 0 8px' }}>
            {LADDER_META[step].blurb}
          </p>
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              rig={rig}
              open={openRoute === route.id}
              onToggle={() => setOpenRoute((o) => (o === route.id ? null : route.id))}
            />
          ))}
        </section>
      ))}

      <SectionTitle>Vehicle</SectionTitle>
      <div className="card card--flat">
        <p className="muted" style={{ marginTop: 0 }}>
          {destination.vehicleNotes}
        </p>
        <p className="tiny" style={{ margin: '0 0 10px' }}>
          <span className="faint">YOUR RIG · </span>
          <strong>{rigName}</strong>{' '}
          <span className="muted">
            ({RIG_SHORT[rig.rigClass]}) meets the listed minimum on {meets} of{' '}
            {destination.routes.length} routes here.
          </span>
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" onClick={() => go('profile')}>
            Change vehicle
          </button>
          {/bronco/i.test(rig.name) ? (
            <button type="button" className="btn btn--ghost" onClick={() => go('bronco')}>
              🚙 Bronco tab
            </button>
          ) : (
            <span />
          )}
        </div>
        {/bronco/i.test(rig.name) && (
          <p className="tiny faint" style={{ margin: '8px 0 0' }}>
            G.O.A.T. modes, tire pressures and recovery gear for this truck
            live on the Bronco tab.
          </p>
        )}
      </div>

      <SectionTitle>Camping</SectionTitle>
      {destination.camping.map((camp) => (
        <div key={camp.name} className="card card--flat">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{camp.name}</h3>
          <div className="chips" style={{ margin: '8px 0' }}>
            <span className="chip">
              {camp.kind === 'dispersed'
                ? 'Dispersed'
                : camp.kind === 'developed'
                  ? 'Campground'
                  : 'Type UNKNOWN'}
            </span>
            {camp.sites !== null && <span className="chip">{formatMeasure(camp.sites)} sites</span>}
          </div>
          <p className="tiny" style={{ margin: '0 0 6px' }}>
            <span className="faint">FEE · </span>
            <span style={camp.fee || camp.kind === 'dispersed' ? undefined : { color: 'var(--caution)' }}>
              {camp.fee ?? (camp.kind === 'dispersed' ? 'None listed' : 'UNKNOWN')}
            </span>
          </p>
          <p className="tiny muted" style={{ margin: '0 0 8px' }}>
            {camp.note}
          </p>
          {camp.url && (
            <a className="tiny" href={camp.url} target="_blank" rel="noreferrer noopener">
              Details ↗
            </a>
          )}
          <SourceLine ids={camp.sources} lastChecked={camp.lastChecked} />
        </div>
      ))}
      <div className="warn warn--caution">
        <span className="warn__mark" aria-hidden="true">
          !
        </span>
        <span>
          Listing a spot here does not make it legal to camp in. Signs on the
          ground and current fire restrictions are the authority. Fees were
          correct when checked and change.
        </span>
      </div>

      <Places title="Fuel" places={destination.fuel} />
      <Places title="Food" places={destination.food} />

      <SectionTitle>Adventure nearby</SectionTitle>
      <ul className="tiny muted" style={{ paddingLeft: 18 }}>
        {destination.nearby.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>

      <SectionTitle>Conditions</SectionTitle>
      <div className="card card--flat">
        <div className="eyebrow">Typical season · {destination.season.confidence}</div>
        <p className="tiny muted" style={{ margin: '4px 0 0' }}>
          <strong style={{ color: 'var(--bone)' }}>
            {formatSeasonMonths(destination.season)}.
          </strong>{' '}
          {destination.season.note}
        </p>
        <SourceLine ids={destination.season.sources} lastChecked={destination.season.lastChecked} />
      </div>
      {destination.warnings.map((w) => (
        <div key={w} className="warn warn--caution">
          <span className="warn__mark" aria-hidden="true">
            !
          </span>
          <span>{w}</span>
        </div>
      ))}
      <WeatherPanel
        state={weather}
        isoDate={constraints.date}
        elevationFt={null}
        place={destination.anchor.label}
      />
      {region && (
        <p className="tiny faint">
          Live closures and restrictions are not in this app. Check{' '}
          {sourcesFor(region.conditions).map((s, i, all) => (
            <span key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
              {i < all.length - 1 ? ', ' : ''}
            </span>
          ))}{' '}
          on the day.
        </p>
      )}

      <SectionTitle>Resources</SectionTitle>
      <div className="link-list">
        {sourcesFor(destination.resources).map((s) => (
          <a key={s.id} className="link-list__item" href={s.url} target="_blank" rel="noreferrer noopener">
            <span>{s.label}</span>
            <span className="tiny faint">
              {s.org}
              {s.kind === 'community' ? ' · community' : ''} ↗
            </span>
          </a>
        ))}
      </div>

      <SectionTitle>Getting there</SectionTitle>
      <DriveCard destination={destination} />

      <div style={{ marginTop: 18 }}>
        <SourceLine
          ids={destination.sources}
          lastChecked={destination.lastChecked}
          prefix="Destination sources"
        />
      </div>
    </div>
  )
}

function Places({ title, places }: { title: string; places: PlaceNote[] }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      {places.map((p) => (
        <div key={p.name + p.town} className="card card--flat">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
          <p className="tiny muted" style={{ margin: '4px 0 8px' }}>
            {p.note}
          </p>
          {(p.url || p.phone) && (
            <div className="chips" style={{ marginBottom: 8 }}>
              {p.url && (
                <a className="chip" href={p.url} target="_blank" rel="noreferrer noopener">
                  Website
                </a>
              )}
              {p.phone && (
                <a className="chip" href={`tel:${p.phone}`}>
                  {p.phone}
                </a>
              )}
            </div>
          )}
          <SourceLine ids={p.sources} lastChecked={p.lastChecked} />
        </div>
      ))}
    </>
  )
}

function DriveCard({ destination }: { destination: Destination }) {
  const drive = destination.fromDurango
  return (
    <div className="card card--flat">
      {drive ? (
        <>
          <div className="eyebrow">Durango → {drive.to}</div>
          <div className="stats">
            <div className="stat">
              <div className="stat__value">{formatMeasure(drive.miles, 'mi')}</div>
              <div className="stat__label">Road miles</div>
            </div>
            <div className="stat">
              <div className="stat__value">{formatDurationRange(drive.minutes)}</div>
              <div className="stat__label">Non-stop</div>
            </div>
          </div>
          <p className="tiny muted" style={{ margin: '0 0 6px' }}>
            {drive.via}. Mapping-service estimates, not a promise; ranges mean
            the services disagree.
          </p>
          <SourceLine ids={drive.sources} lastChecked={drive.lastChecked} />
        </>
      ) : (
        <p className="tiny" style={{ color: 'var(--caution)', marginTop: 0 }}>
          Drive from Durango: UNKNOWN. No sourced figure — use your maps app.
        </p>
      )}
      <a
        className="btn btn--primary"
        style={{ marginTop: 10 }}
        href={navigateUrl(destination.anchor.lat, destination.anchor.lon, destination.anchor.label)}
        target="_blank"
        rel="noreferrer noopener"
      >
        Navigate to {destination.anchor.label}
      </a>
      <p className="tiny faint" style={{ margin: '8px 0 0' }}>
        Takes you to town, not onto a trail. Most of this country has no cell
        service; download offline maps before you leave.
      </p>
    </div>
  )
}
