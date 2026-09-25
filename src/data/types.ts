/**
 * Domain types for RayTire.
 *
 * Design rule that outranks everything else in here: the model must be able to
 * say "I don't know". Every physical measurement is a `Measure`, which is
 * either a number, a range (when reputable sources disagree), or `null`
 * meaning UNKNOWN. The UI renders `null` as "UNKNOWN" rather than guessing.
 */

/** A measured quantity. `null` means genuinely unknown -- never fill it in. */
export type Measure = number | MeasureRange | null

export interface MeasureRange {
  min: number
  max: number
}

export type SourceKind =
  | 'agency' // USFS / BLM / NPS / CDOT / county
  | 'operator' // the business or association that runs the thing
  | 'reference' // encyclopedic
  | 'community' // crowd-sourced trail data

export interface Source {
  id: string
  label: string
  org: string
  url: string
  kind: SourceKind
}

/** Anything the user can be shown carries where it came from and when we looked. */
export interface Sourced {
  /** Source ids, see data/sources.ts */
  sources: string[]
  /** ISO date (YYYY-MM-DD) this record was last checked against its sources. */
  lastChecked: string
}

/* ------------------------------------------------------------------ roads */

export type RoadClass =
  | 'paved_highway'
  | 'paved_mountain'
  | 'graded_dirt'
  | 'rough_dirt'
  | 'high_clearance'
  | 'technical_4wd'

export type VehicleRequirement =
  | 'any_vehicle'
  | 'high_clearance'
  | 'four_wd'
  | 'four_wd_low_range'
  | 'unknown'

export interface DriveSegment extends Sourced {
  /** Human label, e.g. "US 550 north over Coal Bank & Molas". */
  via: string
  miles: Measure
  roadClass: RoadClass
  vehicle: VehicleRequirement
  /**
   * Travel time in minutes when the land manager publishes one. A published
   * time always beats our speed model -- the Mesa Verde entrance road is
   * 22 miles and 45 minutes, and no generic mph figure gets that right.
   */
  minutesOverride?: Measure
  /** Free text: gates, shelf road, drop-offs, seasonal gate location. */
  notes?: string
}

/* --------------------------------------------------------------- seasons */

export type SeasonConfidence = 'documented' | 'reported' | 'unknown'

export interface SeasonWindow extends Sourced {
  /**
   * Months (1-12) when access is typically viable. `null` = unknown.
   * These are typical years, not a promise about this year.
   */
  months: number[] | null
  note: string
  confidence: SeasonConfidence
}

/* ----------------------------------------------------------------- hikes */

export type TrailShape =
  | 'out_and_back'
  | 'loop'
  | 'point_to_point'
  | 'partly_off_trail'
  | 'unknown'

export type DogPolicy = 'leash' | 'under_control' | 'prohibited' | 'unknown'

export interface Parking extends Sourced {
  spaces: Measure
  notes: string | null
  fee: string | null
  /** Does the last stretch of road to the lot need more than a car? */
  finalApproach: VehicleRequirement
}

export interface Hike extends Sourced {
  id: string
  name: string
  trailNumber?: string
  shape: TrailShape
  miles: Measure
  gainFt: Measure
  trailheadFt: Measure
  highPointFt: Measure
  /** Land manager's own difficulty wording, only when actually published. */
  ratedDifficulty: string | null
  hazards: string[]
  wilderness: string | null
  dogs: DogPolicy
  permits: string | null
  parking: Parking
  season: SeasonWindow
  lat: number
  lon: number
}

/* --------------------------------------------------------------- camping */

export type CampKind = 'dispersed' | 'developed' | 'unknown'
export type ReservationPolicy =
  | 'first_come'
  | 'reservable'
  | 'mixed'
  | 'none_required'
  | 'unknown'

export interface Camp extends Sourced {
  id: string
  name: string
  kind: CampKind
  sites: Measure
  feeUsd: Measure
  reservations: ReservationPolicy
  reservationUrl: string | null
  elevationFt: Measure
  access: VehicleRequirement
  /** Is there room to level a rig and pop a rooftop tent? */
  rooftopTentNotes: string | null
  water: string | null
  season: SeasonWindow
  restrictions: string[]
  lat: number
  lon: number
}

/* ------------------------------------------------------------ food & beer */

export type FoodKind = 'brewery' | 'brewpub' | 'restaurant' | 'cafe' | 'casual'

/**
 * Explicit operating status. Only `active` may be offered as a current
 * recommendation -- everything else is kept in the dataset (so the app never
 * forgets and re-suggests it) but filtered out of anything the user would
 * actually drive to today.
 */
export type BusinessStatus =
  | 'active'
  | 'seasonal'
  | 'temporarily_closed'
  | 'permanently_closed'
  | 'unknown'

export interface FoodStop extends Sourced {
  id: string
  name: string
  kind: FoodKind
  town: string
  address: string | null
  url: string | null
  phone: string | null
  /**
   * Hours are deliberately NOT stored as fact. They change constantly and a
   * stale hour is a wasted drive. We store what we last saw, plainly labelled.
   */
  hoursNote: string | null
  status: BusinessStatus
  /** True when closures are a normal part of this business's yearly cycle. */
  seasonal: boolean
  /** Why it is not `active`, when it isn't. Kept so the recommender never forgets. */
  closureReason: string | null
  /** Reported reopening date/season, if any evidence exists. */
  reopeningDate: string | null
  /** Anything else worth a human reading before they drive out -- relocations, name changes, ownership changes. */
  notes: string | null
  lat: number
  lon: number
}

/* ------------------------------------------------------------ adventures */

export type AdventureMode =
  | 'big_day'
  | 'fourwd'
  | 'day_trip'
  | 'overnighter'
  | 'explorer'
  | 'full_send'

export type AdventureDepth =
  | 'quick_outing'
  | 'half_day'
  | 'full_day'
  | 'big_day'
  | 'expedition'

export type StopKind =
  | 'scenic'
  | 'historic'
  | 'ghost_town'
  | 'mine'
  | 'geology'
  | 'overlook'
  | 'water'
  | 'photo'
  | 'town'

export interface Stop extends Sourced {
  id: string
  name: string
  kind: StopKind
  /** Typical time on the ground, minutes. Null when it is purely a drive-by. */
  dwellMinutes: number | null
  blurb: string
  lat: number
  lon: number
  elevationFt: Measure
}

export interface Adventure extends Sourced {
  id: string
  name: string
  tagline: string
  region: string
  modes: AdventureMode[]
  /** Primary destination, used for navigation hand-off. */
  anchor: { lat: number; lon: number; label: string }
  /** Durango -> anchor. */
  outbound: DriveSegment[]
  /** Optional different way home; when omitted we retrace `outbound`. */
  returnVia?: DriveSegment[]
  /** Hike options, first is the default. Empty = no hiking. */
  hikeIds: string[]
  stopIds: string[]
  campIds: string[]
  /** Suggested food/beer, in preference order. */
  foodIds: string[]
  why: string
  highlights: string[]
  hazards: string[]
  season: SeasonWindow
  /** Interests this satisfies, used for matching against the profile. */
  interests: InterestTag[]
}

export type InterestTag =
  | 'scenery'
  | 'history'
  | 'hiking'
  | 'offroad'
  | 'geology'
  | 'water'
  | 'remote'
  | 'wildflowers'
  | 'archaeology'
  | 'railroad'

/* ---------------------------------------------------------------- profile */

export interface ExperienceProfile {
  /** Preferred hiking distance band, miles. */
  hikeMiles: { min: number; max: number }
  /** Ceiling on elevation gain the couple wants in a day, feet. */
  maxGainFt: number
  /** Highest elevation they want to be at, feet. */
  maxElevationFt: number
  /** Ceiling on one-way driving, minutes. */
  maxDriveMinutes: number
  /** 0-3 appetite dials. */
  technicalTerrain: 0 | 1 | 2 | 3
  offroad: 0 | 1 | 2 | 3
  remoteness: 0 | 1 | 2 | 3
  camping: 0 | 1 | 2 | 3
  foodImportance: 0 | 1 | 2 | 3
  interests: InterestTag[]
  preferredDepth: AdventureDepth[]
  /** Flat-ground hiking pace, mph. Drives every time estimate. */
  paceMph: number
  /** Show the investment-memo presentation layer. */
  financeMode: boolean
  /** What they drive. Used to say whether a route's vehicle class is met. */
  rig: RigProfile
}

/* --------------------------------------------------------------- planning */

export interface PlanConstraints {
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** Minutes after midnight. */
  earliestDeparture: number
  homeByMinutes: number
  maxDriveMinutes: number
  hikeAppetite: 'none' | 'short' | 'moderate' | 'long'
  food: 'none' | 'lunch' | 'brewery' | 'dinner' | 'surprise'
  interests: InterestTag[]
  modes: AdventureMode[]
}

export type LegKind =
  | 'depart'
  | 'drive'
  | 'stop'
  | 'hike'
  | 'food'
  | 'camp'
  | 'arrive'

export interface ItineraryLeg {
  kind: LegKind
  title: string
  detail: string
  startMinutes: number
  endMinutes: number
  /** Ids into the data layer so the UI can deep-link. */
  refId?: string
  vehicle?: VehicleRequirement
  /** True when the duration is a model estimate rather than a sourced fact. */
  estimated: boolean
}

export interface Itinerary {
  adventureId: string
  date: string
  legs: ItineraryLeg[]
  departMinutes: number
  homeMinutes: number
  driveMinutes: number
  hikeMinutes: number
  totalMinutes: number
  driveMiles: Measure
  hikeMiles: Measure
  gainFt: Measure
  maxElevationFt: Measure
  depth: AdventureDepth
  vehicle: VehicleRequirement
  /** True when the plan ends at a campsite rather than back in Durango. */
  overnight: boolean
  /** Legs whose length was never sourced, so the totals are floors. */
  unmeasuredLegs: number
  warnings: Warning[]
  hikeId: string | null
  foodId: string | null
  campId: string | null
}

export type WarningLevel = 'info' | 'caution' | 'blocker'

export interface Warning {
  level: WarningLevel
  message: string
}

/* ------------------------------------------------------ regions & off-road */

/**
 * Durango day trips are planned minute by minute. A Utah destination is a
 * different shape of thing -- a place you drive to for days and explore from
 * -- so it gets its own model rather than being forced through the itinerary
 * engine. The honesty rules are the same: Measure for numbers, UNKNOWN when
 * nobody credible said, sources and a check date on every record.
 */

/**
 * The app's own three-step scale. It is a summary for scanning, never a
 * promise: a route's published rating and its hazards always render next to
 * it. `unknown` means no rating could be sourced, and it says so.
 */
export type TrailRating = 'beginner' | 'intermediate' | 'advanced' | 'unknown'

/** What the ground and the route actually ask of you. */
export type RouteFeature =
  | 'slickrock'
  | 'sand'
  | 'rock_crawling'
  | 'steep_climbs'
  | 'water_crossings'
  | 'narrow_ledges'
  | 'shelf_road'
  | 'graded_gravel'
  | 'mud_when_wet'
  | 'high_clearance'
  | 'four_wd'
  | 'recovery_gear'
  | 'whip_flag'
  | 'width_limits'
  | 'remote'
  | 'permit'
  | 'forest'

/**
 * Vehicle classes, easiest to hardest. Deliberately about the vehicle, not a
 * brand: the Bronco is one rig that can be entered, not the system.
 */
export type RigClass =
  | 'standard_suv'
  | 'high_clearance'
  | 'four_wd'
  | 'advanced_4wd'
  | 'specialized'
  | 'unknown'

export type AdventureStyle =
  | 'rock_crawling'
  | 'scenic_backroad'
  | 'dunes'
  | 'multi_day_ohv'
  | 'desert_exploring'
  | 'mountain_backway'

/** The rig the user drives. Any vehicle; the Bronco is only the default. */
export interface RigProfile {
  name: string
  rigClass: Exclude<RigClass, 'unknown'>
}

export interface PublishedRating {
  /** Source id of whoever published it. */
  by: string
  /** Their words, verbatim-ish: "5 of 10", "Difficult", "Easy". */
  says: string
}

export interface OffroadRoute extends Sourced {
  id: string
  name: string
  blurb: string
  rating: TrailRating
  /** What third parties actually published. Empty = nobody rated it. */
  published: PublishedRating[]
  /** Why the route sits where it does on our scale, disagreements included. */
  ratingBasis: string
  miles: Measure
  milesNote?: string
  features: RouteFeature[]
  /** Minimum sensible vehicle class. Minimum, not sufficient. */
  rig: RigClass
  hazards: string[]
  /** Official or operator page for this route, when one exists. */
  officialUrl: string | null
  /** Text for a maps search. Never invented coordinates. */
  mapQuery: string
}

export interface PlaceNote extends Sourced {
  name: string
  /** Town the service is in. */
  town: string
  note: string
  url: string | null
  phone: string | null
  /** Set when known closed, so it is never re-suggested. */
  closed: string | null
}

export interface DestinationCamp extends Sourced {
  name: string
  kind: CampKind
  sites: Measure
  /** Stored as a labelled string with a check date -- fees change. */
  fee: string | null
  reservations: ReservationPolicy
  note: string
  url: string | null
}

export interface DriveFromHome extends Sourced {
  /** What the numbers are measured to, e.g. "Moab" or "Green River (gateway)". */
  to: string
  miles: Measure
  minutes: Measure
  via: string
}

export interface SkillsSchool extends Sourced {
  name: string
  where: string
  note: string
  url: string
}

export interface Destination extends Sourced {
  id: string
  regionId: string
  name: string
  /** Where it is, the way a person would say it. */
  area: string
  emoji: string
  flagship: boolean
  tagline: string
  why: string
  /** What the driving actually feels like. */
  feel: string
  terrain: RouteFeature[]
  styles: AdventureStyle[]
  /** Town-centre anchor for weather and the maps hand-off. */
  anchor: { lat: number; lon: number; label: string }
  fromDurango: DriveFromHome | null
  season: SeasonWindow
  vehicleNotes: string
  routes: OffroadRoute[]
  camping: DestinationCamp[]
  fuel: PlaceNote[]
  food: PlaceNote[]
  nearby: string[]
  warnings: string[]
  /** Source ids surfaced as the "go read the real thing" list. */
  resources: string[]
  skillsSchool?: SkillsSchool
}

export interface Region {
  id: string
  name: string
  state: string
  emoji: string
  tagline: string
  /** The home region is the existing Durango planner. */
  home: boolean
  /** Region-wide live-conditions links, as source ids. */
  conditions: string[]
}

/* ------------------------------------------------------------------ bronco */

/**
 * A physical spec that is genuinely one fixed number does not need this, but
 * several Bronco/Sasquatch figures differ by body style, trim, engine or
 * printing, and Ford's own materials disagree with each other on a couple of
 * them. Same rule as everywhere else: sourced, ranged when sources disagree,
 * UNKNOWN when nobody credible said.
 */
export type BroncoConfigFactor = 'body_style' | 'trim' | 'engine' | 'model_year'

export interface BroncoMeasure extends Sourced {
  id: string
  label: string
  value: Measure
  unit: string
  decimals?: number
  /** Which configuration axes this figure actually depends on, if any. */
  variesBy: BroncoConfigFactor[]
  note: string
}

export type GoatModeId =
  | 'normal'
  | 'eco'
  | 'sport'
  | 'slippery'
  | 'sand'
  | 'mud_ruts'
  | 'baja'
  | 'rock_crawl'

export interface GoatMode extends Sourced {
  id: GoatModeId
  name: string
  glyph: string
  /** Which trims actually get this mode -- G.O.A.T. Modes are trim-dependent. */
  standardOn: string
  whatItDoes: string
  bestFor: string
  whenToUse: string
  fieldNote: string
}

export interface CheatSheetEntry {
  id: string
  glyph: string
  title: string
  guidance: string
  note?: string
}

export interface BroncoTireInfo extends Sourced {
  factorySize: string
  wheels: string
  spare: string
  coldPressureNote: string
  offRoadPressureNote: string
  tpmsNote: string
  repairKitNote: string
}

export interface RecoveryItem {
  id: string
  label: string
  note?: string
}

export interface RoofTentPhase {
  title: string
  items: string[]
}

export interface PreAdventureChecklistItem {
  id: string
  label: string
}
