import type { SeasonWindow, Warning } from '../data/types'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Month index 1-12 from an ISO date, without timezone surprises. */
export function monthOf(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) throw new Error(`Not an ISO date: "${isoDate}"`)
  const month = Number(match[2])
  if (month < 1 || month > 12) throw new Error(`Bad month in "${isoDate}"`)
  return month
}

export type SeasonVerdict = 'in_season' | 'shoulder' | 'out_of_season' | 'unknown'

/**
 * Whether the typical access window covers this date. "Typical" is the load
 * bearing word: this says nothing about the snow that fell last night, which
 * is why the warning always points the user at the land manager.
 */
export function seasonVerdict(season: SeasonWindow, isoDate: string): SeasonVerdict {
  if (season.months === null || season.months.length === 0) return 'unknown'
  const month = monthOf(isoDate)
  if (season.months.includes(month)) return 'in_season'

  const prev = month === 1 ? 12 : month - 1
  const next = month === 12 ? 1 : month + 1
  if (season.months.includes(prev) || season.months.includes(next)) {
    return 'shoulder'
  }
  return 'out_of_season'
}

export function seasonWarnings(
  season: SeasonWindow,
  isoDate: string,
  subject: string,
): Warning[] {
  const verdict = seasonVerdict(season, isoDate)
  const month = MONTH_NAMES[monthOf(isoDate) - 1]

  switch (verdict) {
    case 'out_of_season':
      return [
        {
          level: 'blocker',
          message: `${subject} is normally out of season in ${month}. ${season.note}`,
        },
      ]
    case 'shoulder':
      return [
        {
          level: 'caution',
          message: `${month} is on the edge of the usual window for ${subject}. ${season.note} Confirm current access before committing.`,
        },
      ]
    case 'unknown':
      return [
        {
          level: 'caution',
          message: `SEASONAL ACCESS UNKNOWN for ${subject}. ${season.note}`,
        },
      ]
    default:
      return []
  }
}

export function formatSeasonMonths(season: SeasonWindow): string {
  if (season.months === null || season.months.length === 0) return 'UNKNOWN'
  const sorted = [...season.months].sort((a, b) => a - b)
  const runs: number[][] = []
  for (const month of sorted) {
    const last = runs[runs.length - 1]
    if (last && month === last[last.length - 1] + 1) last.push(month)
    else runs.push([month])
  }
  return runs
    .map((run) =>
      run.length === 1
        ? MONTH_NAMES[run[0] - 1].slice(0, 3)
        : `${MONTH_NAMES[run[0] - 1].slice(0, 3)}–${MONTH_NAMES[run[run.length - 1] - 1].slice(0, 3)}`,
    )
    .join(', ')
}
