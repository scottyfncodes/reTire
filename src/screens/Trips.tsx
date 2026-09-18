import { ADVENTURES_BY_ID } from '../data/adventures'
import { DEPTH_LABEL } from '../engine/depth'
import { formatClock } from '../engine/time'
import { useStore } from '../state/store'
import { SectionTitle } from '../components/Bits'

export function Trips({ go }: { go: (path: string) => void }) {
  const { trips, removeTrip, saveTrip } = useStore()

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <h1 className="display">Saved</h1>
      <p className="tiny faint" style={{ marginBottom: 16 }}>
        Saved plans work with no signal. Mark one "we're doing this" and it
        shows up on the home screen for both of you.
      </p>

      {trips.length === 0 && (
        <p className="muted">
          Nothing saved yet. Open an adventure and save the plan.
        </p>
      )}

      {trips.map((trip) => {
        const adventure = ADVENTURES_BY_ID[trip.adventureId]
        return (
          <div key={trip.id} className="card">
            <div className="chips" style={{ marginBottom: 8 }}>
              <span className="chip chip--depth">
                {DEPTH_LABEL[trip.itinerary.depth]}
              </span>
              {trip.confirmed && (
                <span className="chip chip--truck">Confirmed</span>
              )}
            </div>
            <h3 className="headline">{trip.name}</h3>
            <p className="tiny faint" style={{ margin: '4px 0 10px' }}>
              {trip.constraints.date} · leave{' '}
              {formatClock(trip.itinerary.departMinutes)} ·{' '}
              {trip.itinerary.overnight
                ? 'overnight'
                : `home ${formatClock(trip.itinerary.homeMinutes)}`}
            </p>

            <textarea
              value={trip.notes}
              placeholder="Notes for the two of you — who is driving, what to bring, where to meet."
              onChange={(e) => saveTrip({ ...trip, notes: e.target.value })}
            />

            <div className="btn-row" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  adventure ? go(`adventure/${adventure.id}`) : undefined
                }
              >
                Open
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => saveTrip({ ...trip, confirmed: !trip.confirmed })}
              >
                {trip.confirmed ? 'Unconfirm' : "We're doing this"}
              </button>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ marginTop: 10 }}
              onClick={() => removeTrip(trip.id)}
            >
              Delete
            </button>
          </div>
        )
      })}

      <SectionTitle>How sharing works</SectionTitle>
      <p className="tiny faint">
        Notes and packing ticks live on this device. Two phones means two
        copies — deliberate, since it keeps the app working with no signal and
        no account to sign in to at a trailhead.
      </p>
    </div>
  )
}
