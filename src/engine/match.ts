import type {
  Adventure,
  AdventureMode,
  ExperienceProfile,
  PlanConstraints,
} from '../data/types'
import { ADVENTURES } from '../data/adventures'
import { HIKES_BY_ID } from '../data/hikes'
import { estimateDrive } from './drive'
import { seasonVerdict } from './season'
import { high, mid } from './measure'

export const MODE_META: Record<
  AdventureMode,
  { emoji: string; label: string; blurb: string }
> = {
  big_day: {
    emoji: '\u{1F3D4}️',
    label: 'BIG DAY',
    blurb: 'Serious hiking and big objectives.',
  },
  fourwd: {
    emoji: '\u{1F699}',
    label: '4WD MISSION',
    blurb: 'Roads that need the truck.',
  },
  day_trip: {
    emoji: '\u{1F5FA}️',
    label: 'DAY TRIP',
    blurb: 'Out and back to Durango, same day.',
  },
  overnighter: {
    emoji: '⛺',
    label: 'OVERNIGHTER',
    blurb: 'Rooftop tent goes up.',
  },
  explorer: {
    emoji: '\u{1F3DA}️',
    label: 'EXPLORER',
    blurb: 'Ghost towns, mines and odd geography.',
  },
  full_send: {
    emoji: '\u{1F37A}',
    label: 'FULL SEND',
    blurb: 'Adventure first, then a cold one.',
  },
}

export interface ScoredAdventure {
  adventure: Adventure
  score: number
  reasons: string[]
  blockers: string[]
}

export interface MatchInput {
  mode: AdventureMode | null
  constraints: PlanConstraints
  profile: ExperienceProfile
  /** Adventure ids done recently, so the app stops suggesting the same day. */
  recentIds?: string[]
}

/**
 * Scores every adventure against the day. Out-of-season routes are not deleted
 * -- they are pushed down and labelled, because "it is November" is a fact the
 * user can see and overrule, not something to hide from them.
 */
export function scoreAdventures(input: MatchInput): ScoredAdventure[] {
  const { mode, constraints, profile, recentIds = [] } = input

  return ADVENTURES.map((adventure) => {
    const reasons: string[] = []
    const blockers: string[] = []
    let score = 50

    if (mode && !adventure.modes.includes(mode)) {
      score -= 100
      blockers.push(`Not a ${MODE_META[mode].label.toLowerCase()} route`)
    } else if (mode) {
      score += 15
    }

    const verdict = seasonVerdict(adventure.season, constraints.date)
    if (verdict === 'out_of_season') {
      score -= 60
      blockers.push('Normally out of season on this date')
    } else if (verdict === 'shoulder') {
      score -= 12
      reasons.push('Edge of the usual season')
    } else if (verdict === 'unknown') {
      score -= 8
      blockers.push('SEASONAL ACCESS UNKNOWN')
    } else {
      score += 10
    }

    const drive = estimateDrive(adventure.outbound)
    const driveMinutes = high(drive.minutes) ?? 0
    const driveLimit = Math.min(
      constraints.maxDriveMinutes,
      profile.maxDriveMinutes,
    )
    if (driveMinutes > driveLimit) {
      // A stated driving limit is a constraint, not a mild preference. The
      // penalty has to be big enough to actually move a well-matched route
      // off the top of the list, or the setting does nothing.
      score -= Math.min(90, 25 + (driveMinutes - driveLimit) * 0.6)
      blockers.push('Longer drive than you asked for')
    } else {
      score += 8
      if (driveMinutes <= driveLimit * 0.6) reasons.push('Short drive')
    }

    const hike = adventure.hikeIds
      .map((id) => HIKES_BY_ID[id])
      .find(Boolean)

    if (constraints.hikeAppetite === 'none') {
      if (!hike) {
        score += 12
        reasons.push('No walking required')
      }
    } else if (hike) {
      const miles = mid(hike.miles) ?? 0
      const target = appetiteTarget(constraints.hikeAppetite)
      const gap = Math.abs(miles - target)
      score += Math.max(0, 18 - gap * 4)
      if (gap <= 1.5) reasons.push('Hike length is about what you wanted')

      const gain = high(hike.gainFt)
      if (gain !== null && gain > profile.maxGainFt) {
        score -= 15
        blockers.push('More climbing than your profile ceiling')
      }
      const top = high(hike.highPointFt)
      if (top !== null && top > profile.maxElevationFt) {
        score -= 15
        blockers.push('Higher than your profile ceiling')
      }
    } else {
      score -= 10
    }

    const wanted = new Set([...constraints.interests, ...profile.interests])
    const overlap = adventure.interests.filter((i) => wanted.has(i))
    score += overlap.length * 6
    if (overlap.length >= 2) {
      reasons.push(`Matches ${overlap.slice(0, 3).join(', ')}`)
    }

    const needsTruck = adventure.outbound.some(
      (s) => s.vehicle === 'four_wd' || s.vehicle === 'four_wd_low_range',
    )
    if (needsTruck) {
      score += profile.offroad * 5 - 5
      if (profile.offroad >= 2) reasons.push('Uses the Bronco properly')
    }

    if (constraints.food !== 'none' && adventure.foodIds.length > 0) {
      score += profile.foodImportance * 3
    }

    if (recentIds.includes(adventure.id)) {
      score -= 25
      reasons.push('You did this one recently')
    }

    return { adventure, score, reasons, blockers }
  }).sort((a, b) => b.score - a.score)
}

function appetiteTarget(appetite: PlanConstraints['hikeAppetite']): number {
  switch (appetite) {
    case 'short':
      return 3
    case 'moderate':
      return 6
    case 'long':
      return 9
    default:
      return 0
  }
}

/**
 * Dealer's choice. Picks from the plausible top of the list rather than the
 * absolute best, so asking twice gives two different days -- but never picks
 * something with a blocker on it if anything clean is available.
 */
export function dealersChoice(
  scored: ScoredAdventure[],
  random: () => number = Math.random,
): ScoredAdventure | null {
  if (scored.length === 0) return null
  const clean = scored.filter((s) => s.blockers.length === 0)
  const pool = (clean.length > 0 ? clean : scored).slice(0, 5)
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
  return pool[index]
}
