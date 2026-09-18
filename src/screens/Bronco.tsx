import { useState } from 'react'
import {
  BRONCO_BREAKOVER,
  BRONCO_DASHBOARD,
  BRONCO_FACTORY_EQUIPMENT,
  BRONCO_FACTORY_RECOVERY,
  BRONCO_PERSONAL_RECOVERY_GEAR,
  BRONCO_RANGE_ESTIMATE,
  BRONCO_RECOVERY_SAFETY_NOTE,
  CHEAT_SHEET,
  GOAT_MODES,
  PRE_ADVENTURE_CHECKLIST,
  ROOF_TENT_PHASES,
  TIRE_INFO,
} from '../data/bronco'
import type { BroncoMeasure } from '../data/types'
import { formatMeasure } from '../engine/measure'
import { SectionTitle, SourceLine } from '../components/Bits'
import { readJson, writeJson } from '../services/storage'

export function Bronco({ go }: { go: (path: string) => void }) {
  const [checked, setChecked] = useState<string[]>(() =>
    readJson('broncoChecklist', [] as string[]),
  )

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id]
      writeJson('broncoChecklist', next)
      return next
    })
  }

  const resetChecklist = () => {
    setChecked([])
    writeJson('broncoChecklist', [])
  }

  return (
    <div>
      <button type="button" className="backlink" onClick={() => go('')}>
        ← Home
      </button>

      <div className="chips" style={{ marginBottom: 10 }}>
        <span className="chip chip--truck">Sasquatch Package</span>
      </div>
      <h1 className="display">🚙 Your Bronco</h1>
      <p className="tiny faint" style={{ marginBottom: 18 }}>
        Not an owner's manual. What you actually need to know before pointing
        it at a forest road. Figures below are Ford's own published numbers
        for the Sasquatch Package on the current-generation Bronco — where a
        figure depends on body style, trim or engine, that is called out
        rather than flattened into one number. This truck's own door placard
        and build sheet always win over anything printed here.
      </p>

      <div className="grid-3">
        {BRONCO_DASHBOARD.map((m) => (
          <DashTile key={m.id} fact={m} />
        ))}
      </div>

      <details className="card" style={{ marginTop: 4 }}>
        <summary>Full spec sheet & factory equipment</summary>
        <DashRow fact={BRONCO_BREAKOVER} />
        <p className="tiny" style={{ marginTop: 10 }}>
          <span className="faint" style={{ letterSpacing: '0.08em' }}>
            ESTIMATED RANGE
          </span>
          <br />
          {formatMeasure(BRONCO_RANGE_ESTIMATE.value, BRONCO_RANGE_ESTIMATE.unit)}{' '}
          <span className="tiny faint">est.</span>
          <br />
          <span className="tiny faint">{BRONCO_RANGE_ESTIMATE.note}</span>
        </p>
        <div className="eyebrow" style={{ marginTop: 14 }}>
          Factory off-road equipment
        </div>
        <ul className="tiny muted" style={{ paddingLeft: 18 }}>
          {BRONCO_FACTORY_EQUIPMENT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <SourceLine ids={['ford_bronco']} lastChecked={BRONCO_BREAKOVER.lastChecked} />
      </details>

      <SectionTitle>G.O.A.T. Modes</SectionTitle>
      <p className="tiny faint" style={{ marginTop: -6, marginBottom: 12 }}>
        Which of these are actually on this truck depends on trim — check the
        mode dial in the cluster. Nothing below is invented; it is what Ford
        documents each mode doing.
      </p>
      {GOAT_MODES.map((mode) => (
        <details key={mode.id} className="card card--flat">
          <summary>
            <span>
              <span aria-hidden="true" style={{ marginRight: 8 }}>
                {mode.glyph}
              </span>
              {mode.name}
            </span>
          </summary>
          <p className="tiny faint" style={{ marginTop: 0 }}>{mode.standardOn}</p>
          <Field label="What it does" value={mode.whatItDoes} />
          <Field label="Best for" value={mode.bestFor} />
          <Field label="When to use it" value={mode.whenToUse} />
          <Field label="Field note" value={mode.fieldNote} />
          <SourceLine ids={mode.sources} lastChecked={mode.lastChecked} />
        </details>
      ))}

      <SectionTitle>Off-road cheat sheet</SectionTitle>
      <p className="tiny faint" style={{ marginTop: -6, marginBottom: 12 }}>
        Quick reference, not a driving textbook. Having the Sasquatch package
        does not mean a route is currently passable — check conditions.
      </p>
      {CHEAT_SHEET.map((entry) => (
        <div key={entry.id} className="card card--flat">
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            <span aria-hidden="true" style={{ marginRight: 8 }}>
              {entry.glyph}
            </span>
            {entry.title}
          </h3>
          <p className="tiny muted" style={{ margin: '6px 0 0' }}>{entry.guidance}</p>
          {entry.note && (
            <p className="tiny faint" style={{ margin: '4px 0 0' }}>{entry.note}</p>
          )}
        </div>
      ))}

      <SectionTitle>Tires</SectionTitle>
      <div className="card">
        <Field label="Factory size" value={TIRE_INFO.factorySize} />
        <Field label="Wheels" value={TIRE_INFO.wheels} />
        <Field label="Spare" value={TIRE_INFO.spare} />
        <Field label="Cold tire pressure" value={TIRE_INFO.coldPressureNote} />
        <Field label="Airing down" value={TIRE_INFO.offRoadPressureNote} />
        <Field label="TPMS" value={TIRE_INFO.tpmsNote} />
        <Field label="Repair kit" value={TIRE_INFO.repairKitNote} />
        <p className="tiny" style={{ color: 'var(--caution)' }}>
          Always air back up toward placard pressure before extended pavement
          travel — an aired-down tire run fast on the highway wears and heats
          unevenly.
        </p>
        <SourceLine ids={TIRE_INFO.sources} lastChecked={TIRE_INFO.lastChecked} />
      </div>

      <SectionTitle>Recovery</SectionTitle>
      <div className="card">
        <div className="eyebrow">Factory vehicle equipment</div>
        <ul className="tiny muted" style={{ paddingLeft: 18, marginTop: 6 }}>
          {BRONCO_FACTORY_RECOVERY.map((item) => (
            <li key={item.id}>
              {item.label}
              {item.note && <span className="faint"> — {item.note}</span>}
            </li>
          ))}
        </ul>
        <div className="warn warn--caution" style={{ marginTop: 12 }}>
          <span className="warn__mark">!</span>
          <span>{BRONCO_RECOVERY_SAFETY_NOTE}</span>
        </div>
        <div className="eyebrow" style={{ marginTop: 14 }}>
          Recommended personal / recovery gear
        </div>
        <p className="tiny faint" style={{ margin: '4px 0 6px' }}>
          Not factory equipment — a personal kit to carry, our call rather
          than a Ford spec.
        </p>
        <ul className="tiny muted" style={{ paddingLeft: 18 }}>
          {BRONCO_PERSONAL_RECOVERY_GEAR.map((item) => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ul>
        <SourceLine ids={['ford_bronco']} lastChecked={TIRE_INFO.lastChecked} prefix="Factory equipment source" />
      </div>

      <SectionTitle>Roof tent</SectionTitle>
      <p className="tiny faint" style={{ marginTop: -6, marginBottom: 12 }}>
        This tent's exact model isn't something the app knows, so this is a
        generic sequence, not a spec sheet for it.
      </p>
      {ROOF_TENT_PHASES.map((phase) => (
        <div key={phase.title} className="card card--flat">
          <div className="eyebrow">{phase.title}</div>
          <ul className="tiny muted" style={{ paddingLeft: 18, marginTop: 6 }}>
            {phase.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <SectionTitle>Before you go</SectionTitle>
      <div className="card">
        <ul className="checklist">
          {PRE_ADVENTURE_CHECKLIST.map((item) => {
            const done = checked.includes(item.id)
            return (
              <li key={item.id} data-done={done}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(item.id)}
                  aria-label={item.label}
                />
                <span>{item.label}</span>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ marginTop: 10 }}
          onClick={resetChecklist}
        >
          Reset checklist
        </button>
      </div>

      <p className="tiny faint" style={{ marginTop: 18 }}>
        Every route in this app links back here for a Bronco check — vehicle
        capability and current road conditions are two different questions,
        and this app never answers the second one for you.
      </p>
    </div>
  )
}

function DashTile({ fact }: { fact: BroncoMeasure }) {
  return (
    <div className="bigstat">
      <div className="bigstat__value">
        {formatMeasure(fact.value, fact.unit, { decimals: fact.decimals })}
      </div>
      <div className="bigstat__label">{fact.label}</div>
    </div>
  )
}

function DashRow({ fact }: { fact: BroncoMeasure }) {
  return (
    <p className="tiny">
      <span className="faint" style={{ letterSpacing: '0.08em' }}>
        {fact.label.toUpperCase()}
      </span>
      <br />
      {formatMeasure(fact.value, fact.unit, { decimals: fact.decimals })}
      <br />
      <span className="tiny faint">{fact.note}</span>
    </p>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="tiny" style={{ margin: '0 0 10px' }}>
      <span className="faint" style={{ letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </span>
      <br />
      <span className="muted">{value}</span>
    </p>
  )
}
