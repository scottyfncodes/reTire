import type {
  AdventureStyle,
  Destination,
  OffroadRoute,
  RigClass,
  RigProfile,
  RouteFeature,
  TrailRating,
} from '../data/types'

/**
 * Off-road vocabulary and the few decisions the Utah screens make. Pure
 * functions, no React, so the parts that could mislead someone about a trail
 * are the parts under test.
 */

export const RATING_META: Record<
  TrailRating,
  { dot: string; label: string; blurb: string }
> = {
  beginner: {
    dot: '🟢',
    label: 'Beginner',
    blurb: 'Graded or gentle terrain in good conditions. Still backcountry.',
  },
  intermediate: {
    dot: '🟡',
    label: 'Intermediate',
    blurb: 'Real 4WD: steeper rock, sand or exposure. Low range and some experience.',
  },
  advanced: {
    dot: '🔴',
    label: 'Advanced',
    blurb: 'Technical. Built rigs, a spotter and recovery gear.',
  },
  unknown: {
    dot: '⚪',
    label: 'Not rated',
    blurb: 'Nobody credible publishes a rating, so the app will not invent one.',
  },
}

const RATING_ORDER: TrailRating[] = ['beginner', 'intermediate', 'advanced']

export interface DifficultyRange {
  low: TrailRating | null
  high: TrailRating | null
  /** Routes on the scale vs. routes nobody rated. */
  rated: number
  unrated: number
}

/** Easiest and hardest rated route. Unrated routes are counted, not guessed. */
export function difficultyRange(routes: OffroadRoute[]): DifficultyRange {
  const rated = routes.filter((r) => r.rating !== 'unknown')
  const idx = rated.map((r) => RATING_ORDER.indexOf(r.rating))
  return {
    low: idx.length ? RATING_ORDER[Math.min(...idx)] : null,
    high: idx.length ? RATING_ORDER[Math.max(...idx)] : null,
    rated: rated.length,
    unrated: routes.length - rated.length,
  }
}

/** "🟢 → 🔴", "🟢", or "⚪ Not rated" for a card. */
export function formatDifficultyRange(range: DifficultyRange): string {
  if (range.low === null || range.high === null) return `${RATING_META.unknown.dot} Not rated`
  const low = RATING_META[range.low].dot
  const high = RATING_META[range.high].dot
  const body = range.low === range.high ? low : `${low} → ${high}`
  return range.unrated > 0 ? `${body} +${range.unrated} ${RATING_META.unknown.dot}` : body
}

/* --------------------------------------------------------- the ladder */

export type LadderStep = 'start_here' | 'build_confidence' | 'a_game' | 'unrated'

export const LADDER_META: Record<LadderStep, { title: string; blurb: string; rating: TrailRating }> = {
  start_here: {
    title: 'Start here',
    blurb: 'Scenic, forgiving routes to get a feel for the terrain.',
    rating: 'beginner',
  },
  build_confidence: {
    title: 'Build confidence',
    blurb: 'Real slickrock and exposure. Low range, patience, and a turnaround plan.',
    rating: 'intermediate',
  },
  a_game: {
    title: 'Bring your A-game',
    blurb: 'The famous hard lines. Built rigs, experienced drivers, a spotter.',
    rating: 'advanced',
  },
  unrated: {
    title: 'Not rated',
    blurb: 'No published rating. Read the hazards and judge on the ground.',
    rating: 'unknown',
  },
}

const STEP_FOR: Record<TrailRating, LadderStep> = {
  beginner: 'start_here',
  intermediate: 'build_confidence',
  advanced: 'a_game',
  unknown: 'unrated',
}

/**
 * Groups routes into a progression. It is a way to discover the next thing,
 * not a qualification: finishing a school does not make anyone ready for a
 * particular trail, and the UI says so beside this.
 */
export function ladder(routes: OffroadRoute[]): Array<{ step: LadderStep; routes: OffroadRoute[] }> {
  const order: LadderStep[] = ['start_here', 'build_confidence', 'a_game', 'unrated']
  return order
    .map((step) => ({ step, routes: routes.filter((r) => STEP_FOR[r.rating] === step) }))
    .filter((group) => group.routes.length > 0)
}

/* --------------------------------------------------------- vehicles */

export const RIG_LABEL: Record<RigClass, string> = {
  standard_suv: 'Standard SUV (dry conditions)',
  high_clearance: 'High clearance recommended',
  four_wd: '4WD with low range recommended',
  advanced_4wd: 'Advanced 4WD: lockers, bigger tires, an experienced driver',
  specialized: 'Specialized: OHV rules, flags or width limits apply',
  unknown: 'Vehicle requirement UNKNOWN',
}

/** Short form for chips. */
export const RIG_SHORT: Record<RigClass, string> = {
  standard_suv: 'Standard SUV',
  high_clearance: 'High clearance',
  four_wd: '4WD',
  advanced_4wd: 'Advanced 4WD',
  specialized: 'Specialized',
  unknown: 'UNKNOWN',
}

/** Options for the profile picker, easiest first. */
export const RIG_CHOICES: Array<{ value: RigProfile['rigClass']; label: string; help: string }> = [
  { value: 'standard_suv', label: 'Standard SUV / AWD', help: 'Car-like clearance, no low range.' },
  { value: 'high_clearance', label: 'High clearance', help: 'Truck or SUV clearance, 2WD or AWD.' },
  { value: 'four_wd', label: '4WD + low range', help: 'Stock 4x4 with a transfer case.' },
  { value: 'advanced_4wd', label: 'Lockers + big tires', help: 'Locking diffs and 33 in+ tires, factory (e.g. Bronco Sasquatch) or built.' },
  { value: 'specialized', label: 'OHV / side-by-side', help: 'ATV or UTV, flagged and registered.' },
]

const RIG_RANK: Record<Exclude<RigClass, 'specialized'>, number> = {
  standard_suv: 0,
  high_clearance: 1,
  four_wd: 2,
  advanced_4wd: 3,
  // As with road access: unknown is treated as a reason for caution.
  unknown: 2.5,
}

export type RigFit = 'meets' | 'short' | 'check' | 'unknown'

export interface RigVerdict {
  fit: RigFit
  message: string
}

/**
 * Compares the user's vehicle with a route's minimum vehicle class. The best
 * this can ever say is "meets the minimum" -- never "safe" and never "you can
 * do this". Conditions, driver and line choice decide the rest.
 */
export function rigVerdict(rig: RigProfile, route: OffroadRoute): RigVerdict {
  const name = rig.name.trim() || 'Your rig'

  if (route.rig === 'unknown') {
    return { fit: 'unknown', message: `No sourced vehicle requirement for ${route.name}. Judge it on the ground.` }
  }

  if (route.rig === 'specialized' || rig.rigClass === 'specialized') {
    return {
      fit: 'check',
      message:
        route.rig === 'specialized'
          ? `${route.name} has OHV rules, flags or width limits. Check they fit the ${name} before you go.`
          : `An OHV follows different rules from a road vehicle. Check the ${name} is allowed on ${route.name}.`,
    }
  }

  const need = RIG_RANK[route.rig]
  const have = RIG_RANK[rig.rigClass]
  if (have >= need) {
    const driver =
      route.rating === 'advanced'
        ? ' Hardware is only half of it: this is rated for experienced drivers, so go first with someone who has driven it.'
        : ''
    return {
      fit: 'meets',
      message: `The ${name} meets the minimum vehicle class listed. That is not the same as safe -- conditions and the driver decide the rest.${driver}`,
    }
  }
  return {
    fit: 'short',
    message: `Listed as ${RIG_SHORT[route.rig]}; your profile says ${RIG_SHORT[rig.rigClass]}. Treat this one as beyond the ${name} as entered.`,
  }
}

/* ---------------------------------------------------------- features */

export const FEATURE_META: Record<RouteFeature, { emoji: string; label: string }> = {
  slickrock: { emoji: '🪨', label: 'Slickrock' },
  sand: { emoji: '🏜️', label: 'Sand' },
  rock_crawling: { emoji: '🧗', label: 'Rock crawling' },
  steep_climbs: { emoji: '⛰️', label: 'Steep climbs' },
  water_crossings: { emoji: '💧', label: 'Water crossings' },
  narrow_ledges: { emoji: '⚠️', label: 'Narrow ledges' },
  shelf_road: { emoji: '🛣️', label: 'Shelf road' },
  graded_gravel: { emoji: '🛤️', label: 'Graded gravel' },
  mud_when_wet: { emoji: '🌧️', label: 'Impassable when wet' },
  high_clearance: { emoji: '📏', label: 'High clearance' },
  four_wd: { emoji: '⚙️', label: '4WD' },
  recovery_gear: { emoji: '🪝', label: 'Recovery gear' },
  whip_flag: { emoji: '🚩', label: 'Whip flag' },
  width_limits: { emoji: '↔️', label: 'Width limits' },
  remote: { emoji: '📵', label: 'Remote' },
  permit: { emoji: '🎫', label: 'Permit' },
  forest: { emoji: '🌲', label: 'Forest' },
}

export const STYLE_LABEL: Record<AdventureStyle, string> = {
  rock_crawling: 'Rock crawling',
  scenic_backroad: 'Scenic backroads',
  dunes: 'Dunes',
  multi_day_ohv: 'Multi-day OHV',
  desert_exploring: 'Desert exploring',
  mountain_backway: 'Mountain backways',
}

/** "Slickrock / Sand / Rock crawling" for a card, capped so it stays one line. */
export function terrainLine(dest: Destination, max = 3): string {
  return dest.terrain
    .slice(0, max)
    .map((f) => FEATURE_META[f].label)
    .join(' / ')
}

/**
 * Plain-language glossary for someone who does not speak OHV. Shown once on
 * the region page rather than sprinkled through every card.
 */
export const GLOSSARY: Array<{ term: string; meaning: string }> = [
  { term: 'Slickrock', meaning: 'Bare sandstone. Grippy when dry -- tires climb angles that look impossible -- and slick when wet.' },
  { term: 'Low range', meaning: 'The 4WD gearing for crawling slowly under control, up and especially down.' },
  { term: 'Airing down', meaning: 'Letting tire pressure out for grip on rock and float on sand. Bring a compressor to air back up.' },
  { term: 'Lockers', meaning: 'Differentials that make both wheels on an axle turn together, so one lifted tire does not stop you.' },
  { term: 'Shelf road', meaning: 'A road cut into a cliff face: wall on one side, drop on the other.' },
  { term: 'Spotter', meaning: 'Someone outside the vehicle guiding tire placement over an obstacle. Standard practice on hard lines.' },
  { term: 'Bypass', meaning: 'An easier line around a hard obstacle. Using it is normal, not a failure.' },
  { term: 'Whip flag', meaning: 'A tall red or orange flag Utah requires on OHVs in dune areas, so others see you over crests.' },
  { term: 'Designated sites', meaning: 'Near Moab and other busy areas you may only camp at marked sites, not wherever looks flat.' },
]

/** Hands a place name to the maps app. A search, never an invented coordinate. */
export function mapSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
