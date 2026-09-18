import type { ReactNode } from 'react'
import type { Measure, Warning } from '../data/types'
import { formatMeasure } from '../engine/measure'
import { sourcesFor } from '../data/sources'

export function Stat({
  label,
  value,
  unit = '',
  decimals = 0,
}: {
  label: string
  value: Measure
  unit?: string
  decimals?: number
}) {
  const unknown = value === null
  return (
    <div className="stat">
      <div className={unknown ? 'stat__value stat__value--unknown' : 'stat__value'}>
        {unknown ? 'UNKNOWN' : formatMeasure(value, unit, { decimals })}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

export function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bigstat">
      <div className="bigstat__value">{value}</div>
      <div className="bigstat__label">{label}</div>
    </div>
  )
}

export function WarningList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null
  const order = { blocker: 0, caution: 1, info: 2 }
  const sorted = [...warnings].sort((a, b) => order[a.level] - order[b.level])
  return (
    <div>
      {sorted.map((warning, i) => (
        <div key={i} className={`warn warn--${warning.level}`}>
          <span className="warn__mark" aria-hidden="true">
            {warning.level === 'blocker' ? '✕' : warning.level === 'caution' ? '!' : 'i'}
          </span>
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Source attribution is not a footnote in this app -- it is how the user
 * decides whether to trust a number, so it renders next to the numbers.
 */
export function SourceLine({
  ids,
  lastChecked,
  prefix = 'Source',
}: {
  ids: string[]
  lastChecked?: string
  prefix?: string
}) {
  const sources = sourcesFor(ids)
  if (sources.length === 0) {
    return <p className="source">{prefix}: none recorded.</p>
  }
  return (
    <p className="source">
      {prefix}:{' '}
      {sources.map((source, i) => (
        <span key={source.id}>
          {i > 0 && ', '}
          <a href={source.url} target="_blank" rel="noreferrer noopener">
            {source.label}
          </a>
        </span>
      ))}
      {lastChecked ? ` · last checked ${lastChecked}` : null}
    </p>
  )
}

export function Segmented<T extends string>({
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
      <div className="seg" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
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

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

/** Hands off to whatever maps app the phone prefers. */
export function navigateUrl(lat: number, lon: number, label: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=&travelmode=driving#${encodeURIComponent(label)}`
}
