import type { ExperienceProfile, InterestTag } from '../data/types'
import { DEFAULT_PROFILE } from '../data/profile'
import { useStore } from '../state/store'
import { Field, SectionTitle, Segmented } from '../components/Bits'
import { RIG_CHOICES } from '../engine/offroad'

const INTERESTS: InterestTag[] = [
  'scenery',
  'history',
  'hiking',
  'offroad',
  'geology',
  'water',
  'remote',
  'wildflowers',
  'archaeology',
  'railroad',
]

const DIALS: Array<{ key: keyof ExperienceProfile; label: string; help: string }> = [
  {
    key: 'offroad',
    label: 'Appetite for 4WD roads',
    help: 'How much you want the road itself to be part of the day.',
  },
  {
    key: 'technicalTerrain',
    label: 'Appetite for technical terrain',
    help: 'Scrambling, exposure, route-finding off the trail.',
  },
  {
    key: 'remoteness',
    label: 'Appetite for remote country',
    help: 'How far from help and cell service you want to be.',
  },
  {
    key: 'camping',
    label: 'Appetite for camping',
    help: 'How often the rooftop tent should come into it.',
  },
  {
    key: 'foodImportance',
    label: 'How much the beer matters',
    help: 'Weighting for food and brewery stops in the recommendations.',
  },
]

export function ProfileScreen({ go }: { go: (path: string) => void }) {
  const { profile, setProfile } = useStore()
  const set = (patch: Partial<ExperienceProfile>) =>
    setProfile({ ...profile, ...patch })

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <h1 className="display">Experience profile</h1>
      <p className="tiny faint" style={{ marginBottom: 18 }}>
        These shape what gets recommended and what gets flagged. They never
        change the route's real numbers — those are shown either way, and the
        call is yours.
      </p>

      <SectionTitle>Vehicle</SectionTitle>
      <Field label="What you drive">
        <input
          type="text"
          value={profile.rig.name}
          placeholder="e.g. Ford Bronco, 4Runner, Wrangler"
          onChange={(e) => set({ rig: { ...profile.rig, name: e.target.value } })}
        />
      </Field>
      <Segmented
        label="How it's set up"
        value={profile.rig.rigClass}
        options={RIG_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
        onChange={(v) => set({ rig: { ...profile.rig, rigClass: v } })}
      />
      <p className="tiny faint" style={{ marginTop: -8 }}>
        {RIG_CHOICES.find((c) => c.value === profile.rig.rigClass)?.help} Utah
        routes compare this with their listed minimum vehicle. Meeting the
        minimum is never the same as safe.
      </p>

      <SectionTitle>Walking</SectionTitle>

      <Field label={`Flat-ground pace — ${profile.paceMph} mph`}>
        <input
          type="range"
          min="1.4"
          max="3.4"
          step="0.1"
          value={profile.paceMph}
          onChange={(e) => set({ paceMph: Number(e.target.value) })}
        />
      </Field>
      <p className="tiny faint" style={{ marginTop: -8 }}>
        Every hiking time in the app comes off this number, plus a climbing
        penalty and a thin-air allowance above 10,000 ft.
      </p>

      <Field
        label={`Elevation-gain ceiling — ${profile.maxGainFt.toLocaleString()} ft`}
      >
        <input
          type="range"
          min="500"
          max="5000"
          step="100"
          value={profile.maxGainFt}
          onChange={(e) => set({ maxGainFt: Number(e.target.value) })}
        />
      </Field>

      <Field
        label={`High-point ceiling — ${profile.maxElevationFt.toLocaleString()} ft`}
      >
        <input
          type="range"
          min="8000"
          max="14500"
          step="100"
          value={profile.maxElevationFt}
          onChange={(e) => set({ maxElevationFt: Number(e.target.value) })}
        />
      </Field>

      <Field
        label={`Preferred hike length — ${profile.hikeMiles.min}–${profile.hikeMiles.max} mi`}
      >
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={profile.hikeMiles.max}
          onChange={(e) =>
            set({
              hikeMiles: {
                min: Math.min(profile.hikeMiles.min, Number(e.target.value)),
                max: Number(e.target.value),
              },
            })
          }
        />
      </Field>

      <SectionTitle>Driving</SectionTitle>
      <Field
        label={`Maximum one-way drive — ${Math.round(profile.maxDriveMinutes / 60)}h ${profile.maxDriveMinutes % 60}m`}
      >
        <input
          type="range"
          min="20"
          max="300"
          step="5"
          value={profile.maxDriveMinutes}
          onChange={(e) => set({ maxDriveMinutes: Number(e.target.value) })}
        />
      </Field>

      <SectionTitle>Appetite</SectionTitle>
      {DIALS.map((dial) => (
        <div key={String(dial.key)}>
          <Segmented
            label={dial.label}
            value={String(profile[dial.key] as number)}
            options={[
              { value: '0', label: 'No' },
              { value: '1', label: 'Some' },
              { value: '2', label: 'Yes' },
              { value: '3', label: 'Lots' },
            ]}
            onChange={(v) =>
              set({ [dial.key]: Number(v) } as Partial<ExperienceProfile>)
            }
          />
          <p className="tiny faint" style={{ marginTop: -8 }}>
            {dial.help}
          </p>
        </div>
      ))}

      <SectionTitle>Interests</SectionTitle>
      <div className="chips">
        {INTERESTS.map((interest) => {
          const on = profile.interests.includes(interest)
          return (
            <button
              key={interest}
              type="button"
              className="chip"
              aria-pressed={on}
              style={
                on
                  ? {
                      borderColor: 'var(--ember)',
                      color: 'var(--ember-soft)',
                      background: 'rgb(227 118 44 / 12%)',
                    }
                  : undefined
              }
              onClick={() =>
                set({
                  interests: on
                    ? profile.interests.filter((i) => i !== interest)
                    : [...profile.interests, interest],
                })
              }
            >
              {interest}
            </button>
          )
        })}
      </div>

      <SectionTitle>Presentation</SectionTitle>
      <Segmented
        label="Investment memo layer"
        value={profile.financeMode ? 'on' : 'off'}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
        onChange={(v) => set({ financeMode: v === 'on' })}
      />

      <button
        type="button"
        className="btn btn--ghost"
        style={{ marginTop: 12 }}
        onClick={() => setProfile(DEFAULT_PROFILE)}
      >
        Reset to defaults
      </button>

      <p className="tiny faint" style={{ marginTop: 20 }}>
        Nothing here is inferred from anything you have done before. Having
        climbed a big mountain does not mean you want every hard route — the
        app shows the objective requirements and lets you pick.
      </p>
    </div>
  )
}
