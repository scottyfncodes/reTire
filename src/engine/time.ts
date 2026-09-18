/**
 * Clock arithmetic in minutes-after-midnight. Everything in the planner runs
 * on this so there is exactly one place that can be wrong about time.
 */

export const MINUTES_PER_DAY = 24 * 60

export function parseClock(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) throw new Error(`Not a HH:MM clock time: "${hhmm}"`)
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    throw new Error(`Out of range clock time: "${hhmm}"`)
  }
  return hours * 60 + minutes
}

/** 7:15 AM style, which is how the cards read. */
export function formatClock(minutes: number): string {
  const wrapped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours24 = Math.floor(wrapped / 60)
  const mins = wrapped % 60
  const suffix = hours24 < 12 ? 'AM' : 'PM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`
}

/** "2h 05m" / "45m". Durations, not clock times. */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours === 0) return `${mins}m`
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

/** True when `minutes` crossed into the following day. */
export function spillsPastMidnight(minutes: number): boolean {
  return minutes >= MINUTES_PER_DAY
}

export function roundTo(minutes: number, step: number): number {
  return Math.round(minutes / step) * step
}
