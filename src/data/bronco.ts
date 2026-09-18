import type {
  BroncoMeasure,
  BroncoTireInfo,
  CheatSheetEntry,
  GoatMode,
  PreAdventureChecklistItem,
  RecoveryItem,
  RoofTentPhase,
} from './types'

const CHECKED = '2026-09-18'

/**
 * The Bronco tab exists because the Bronco unlocks the adventures, not because
 * this app wants to be an owner's manual. Every number below is what Ford
 * itself publishes for the Sasquatch Package on the current-generation
 * (2021-2026) full-size Bronco -- these figures have held steady across that
 * run. A handful of them genuinely depend on body style (2-door vs 4-door),
 * trim or engine; those are marked `variesBy` and explained in `note` rather
 * than flattened into one number. Nothing here is guessed, and where the
 * exact configuration of this Bronco is not known to the app, the note says
 * so and points at the vehicle's own door placard / build sheet as the
 * authority.
 */
export const BRONCO_DASHBOARD: BroncoMeasure[] = [
  {
    id: 'ground_clearance',
    label: 'Ground clearance',
    value: { min: 11.5, max: 11.6 },
    unit: 'in',
    decimals: 1,
    variesBy: ['body_style'],
    note: '11.6 in on 2-door Sasquatch, 11.5 in on 4-door Sasquatch, per Ford.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'approach_angle',
    label: 'Approach angle',
    value: 43.3,
    unit: '°',
    decimals: 1,
    variesBy: [],
    note: 'Same for 2-door and 4-door Sasquatch, per Ford.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'departure_angle',
    label: 'Departure angle',
    value: { min: 36.9, max: 37 },
    unit: '°',
    decimals: 1,
    variesBy: ['body_style'],
    note: '37.0° on 2-door Sasquatch, 36.9° on 4-door Sasquatch, per Ford.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'water_fording',
    label: 'Water fording',
    value: 33.5,
    unit: 'in',
    decimals: 1,
    variesBy: [],
    note: 'Sasquatch-equipped figure, per Ford (33.5 in / 85.1 cm). Non-Sasquatch Broncos are rated lower, 31.5 in.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'tire_diameter',
    label: 'Tire size',
    value: 35,
    unit: 'in',
    decimals: 0,
    variesBy: [],
    note: 'LT315/70R17 mud-terrain tires on 17-in beadlock-capable wheels, per Ford. The spare matches -- full-size, not a compact.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'fuel_capacity',
    label: 'Fuel capacity',
    value: { min: 16.9, max: 21.1 },
    unit: 'gal',
    decimals: 1,
    variesBy: ['body_style'],
    note: "2-door is 16.9-17.4 gal and 4-door is 20.8-21.1 gal; Ford's own web spec page and printed owner's manual give slightly different numbers for each. Check your build sheet for the exact figure.",
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
]

/**
 * Breakover angle is genuinely body-style dependent (the 2-door's shorter
 * wheelbase gives it a noticeably better number) and is a second-tier fact
 * next to approach/departure, so it lives in the detail card rather than the
 * landing dashboard.
 */
export const BRONCO_BREAKOVER: BroncoMeasure = {
  id: 'breakover_angle',
  label: 'Breakover angle',
  value: { min: 26.3, max: 29 },
  unit: '°',
  decimals: 1,
  variesBy: ['body_style'],
  note: '29.0° on 2-door Sasquatch, 26.3° on 4-door Sasquatch, per Ford -- the shorter wheelbase is the whole difference.',
  sources: ['ford_bronco'],
  lastChecked: CHECKED,
}

/**
 * Not a Ford figure -- our own arithmetic (EPA combined mpg × tank capacity),
 * shown as a disclosed estimate the same way this app discloses drive-time
 * and hike-time models. Real range will run lower off-road: 35s and the 4.70
 * final drive cost real-world mpg that the EPA combined cycle does not see,
 * and airing down costs more still.
 */
export const BRONCO_RANGE_ESTIMATE = {
  value: { min: 290, max: 380 },
  unit: 'mi',
  note: "Estimated, not a Ford figure: EPA-reported combined economy for Sasquatch-equipped Broncos is about 17 mpg (2.7L V6) to 18 mpg (2.3L I4), times the tank size for your body style. Expect meaningfully less on forest roads, at altitude, or aired down.",
  sources: ['ford_bronco'],
  lastChecked: CHECKED,
}

export const BRONCO_FACTORY_EQUIPMENT: string[] = [
  'Front and rear electronic-locking differentials with a 4.70:1 final drive, geared for the 35s',
  'High-clearance, long-travel suspension with position-sensitive Bilstein dampers',
  'Electronically disconnecting front sway bar for extra front-axle articulation off-road',
  'Steel skid plates and rock rails',
  '35-in mud-terrain tires on 17-in beadlock-capable wheels, plus a matching full-size spare',
  'G.O.A.T. Modes terrain management (see below) -- trim-dependent, not all modes on every Bronco',
  'Advanced 4x4 with automatic on-demand engagement (part-time 4WD with low range on the transfer case)',
]

/** Confirmed factory recovery-adjacent hardware. Nothing here is aftermarket. */
export const BRONCO_FACTORY_RECOVERY: RecoveryItem[] = [
  {
    id: 'tow_hooks',
    label: 'Frame-mounted front tow/recovery hooks',
    note: 'Standard on the Bronco. Rear recovery hardware varies by bumper and hitch configuration -- confirm what your specific rear bumper actually has.',
  },
]

export const BRONCO_RECOVERY_SAFETY_NOTE =
  "Before you ever pull on anything: confirm which points on THIS Bronco are rated recovery points (not everything that looks like a hook is one), and follow Ford's own guidance in the Crash and Breakdown Information chapter of the owner's manual -- rated strap strength, no metal-hook chains or cables, never load a point beyond the vehicle's gross weight rating. This app does not walk through recovery technique; that is exactly the kind of thing that hurts someone when it is learned from an app instead of from the manual and practice."

export const BRONCO_PERSONAL_RECOVERY_GEAR: RecoveryItem[] = [
  { id: 'strap', label: 'Kinetic recovery strap (soft, rated for the vehicle weight)' },
  { id: 'shackles', label: 'Rated soft shackles or D-rings sized to the strap' },
  { id: 'boards', label: 'Traction/recovery boards' },
  { id: 'compressor', label: 'Portable 12V compressor with a gauge' },
  { id: 'repair', label: 'Tire plug/repair kit' },
  { id: 'gloves', label: 'Work gloves' },
  { id: 'light', label: 'Flashlight or headlamp' },
  { id: 'tools', label: 'Basic tool kit, tire iron, jack, wheel chocks' },
  { id: 'firstaid', label: 'First aid kit' },
  { id: 'water', label: 'Extra water, beyond what the hike needs' },
  { id: 'comms', label: 'Emergency communication (satellite messenger/PLB) -- most of this country has no cell service' },
]

/**
 * Ford's own trim breakdown puts a 5-mode set on the entry/mid trims and a
 * 7-mode set on the higher trims, and the exact 7 vary a little by trim and
 * model year. The exact vehicle's trim is not known to this app, so every
 * mode is listed with which trims Ford documents it on -- check the
 * instrument-cluster dial on this specific truck for what is actually there.
 */
export const GOAT_MODES: GoatMode[] = [
  {
    id: 'normal',
    name: 'Normal',
    glyph: '🛣️',
    standardOn: 'All 4x4 Bronco trims',
    whatItDoes: 'Balanced throttle, shifting and traction settings for everyday driving.',
    bestFor: 'Pavement, gravel roads, the drive to the trailhead.',
    whenToUse: 'Your default. Start here and switch out only when the terrain asks for it.',
    fieldNote: 'If you are not sure what to run, run this.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'eco',
    name: 'Eco',
    glyph: '🍃',
    standardOn: 'All 4x4 Bronco trims',
    whatItDoes: 'Softens throttle response and adjusts shift points to favor fuel economy.',
    bestFor: 'Long paved stretches, e.g. the highway miles before the fun starts.',
    whenToUse: 'Cruising with no need for quick throttle response.',
    fieldNote: 'Skip it the moment you actually need the truck to respond.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'sport',
    name: 'Sport',
    glyph: '🏁',
    standardOn: 'All 4x4 Bronco trims',
    whatItDoes: 'Sharper throttle mapping and steering feel, quicker shifts.',
    bestFor: 'Paved mountain roads with real corners, e.g. the passes on US 550.',
    whenToUse: 'When the road is good and you want the truck more responsive.',
    fieldNote: 'Not an off-road mode -- it is the on-road mode with the personality turned up.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'slippery',
    name: 'Slippery',
    glyph: '❄️',
    standardOn: 'All 4x4 Bronco trims',
    whatItDoes: 'Softens throttle and retunes traction/stability control for low-grip surfaces.',
    bestFor: 'Snow, ice, wet pavement, and greasy dirt after rain.',
    whenToUse: 'Any time the surface is slick, on- or off-pavement.',
    fieldNote: 'The one you want for an early or late-season drive with snow still on the shoulders.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'sand',
    name: 'Sand',
    glyph: '🏜️',
    standardOn: 'All 4x4 Bronco trims',
    whatItDoes: 'Adjusts steering and holds lower gears longer to keep momentum, with a low-speed front camera view.',
    bestFor: 'Loose sand.',
    whenToUse: "Not the common case in the San Juans, but it is there if a route needs it.",
    fieldNote: 'Momentum matters more than horsepower in sand -- do not stop and expect to restart easily.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'mud_ruts',
    name: 'Mud/Ruts',
    glyph: '🟤',
    standardOn: 'Documented on higher trims (e.g. Badlands, Wildtrak) -- check this truck’s mode dial rather than assuming.',
    whatItDoes: 'Engages 4WD lock behavior tuned to keep tires driving through mud and rutted ground.',
    bestFor: 'Muddy or deeply rutted forest roads.',
    whenToUse: 'When the road is soft, rutted or actively muddy -- La Plata Canyon after rain is the local example.',
    fieldNote: 'Ruts want you to pick a line and commit, not fight the wheel across them.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'baja',
    name: 'Baja',
    glyph: '💨',
    standardOn: 'Documented on higher trims (e.g. Badlands, Wildtrak, Raptor) -- check this truck’s mode dial rather than assuming.',
    whatItDoes: 'Tunes suspension, throttle and traction control for sustained higher-speed travel on open, loose terrain.',
    bestFor: 'Open desert or graded roads at speed -- not tight technical trail.',
    whenToUse: 'Rarely relevant on the tight, technical San Juan forest roads this app plans around.',
    fieldNote: 'Wrong tool for a narrow shelf road. This is for wide-open terrain, not Ophir Pass.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
  {
    id: 'rock_crawl',
    name: 'Rock Crawl',
    glyph: '🪨',
    standardOn: 'Badlands and Raptor -- check this truck’s mode dial rather than assuming.',
    whatItDoes: 'Engages 4WD low-range lock behavior and the rear locker for maximum low-speed traction, with the front camera active.',
    bestFor: 'Technical rock, ledges, and slow, deliberate lines.',
    whenToUse: 'The technical sections of routes like Engineer Pass or Kennebec Pass, once you are in low range.',
    fieldNote: 'This is a low-range, walking-pace mode. If you are moving fast, you are not using it right.',
    sources: ['ford_bronco'],
    lastChecked: CHECKED,
  },
]

export const CHEAT_SHEET: CheatSheetEntry[] = [
  {
    id: 'rocky',
    glyph: '🪨',
    title: 'Rocky / technical',
    guidance: 'Low range, Rock Crawl mode if this truck has it (else Slippery or 4A/4L manually). Slow and deliberate.',
    note: 'Trims without Rock Crawl still have manual 4L -- pick your line and keep the speed down.',
  },
  {
    id: 'sand',
    glyph: '🏜️',
    title: 'Sand',
    guidance: 'Sand mode if present. Keep momentum; do not stop mid-dune or mid-wash.',
  },
  {
    id: 'mud',
    glyph: '🟤',
    title: 'Mud / ruts',
    guidance: 'Mud/Ruts mode if present, else 4A/4H. Pick a line and commit -- do not fight the ruts.',
    note: 'Airing down helps float here; air back up before real pavement (see Tires).',
  },
  {
    id: 'forest',
    glyph: '🌲',
    title: 'Forest road',
    guidance: '4WD or high-clearance as the route requires (check the road requirement for that specific route). Normal or Slippery mode covers most graded forest roads.',
  },
  {
    id: 'pavement',
    glyph: '🛣️',
    title: 'Back on pavement',
    guidance: 'Normal or Eco mode, 2WD/4A if the drivetrain allows it, and check tire pressure before any real highway distance if you aired down.',
  },
]

export const TIRE_INFO: BroncoTireInfo = {
  factorySize: 'LT315/70R17 (approx. 35 in) mud-terrain, on 17-in beadlock-capable wheels',
  wheels: '17-in beadlock-capable alloy wheels, Sasquatch package',
  spare: 'Full-size, matching spare -- not a compact temporary tire',
  coldPressureNote:
    "Ford specifies a cold tire pressure on this vehicle's own door-jamb placard (driver-side B-pillar). Owner reports on Sasquatch-equipped trucks commonly cite figures in the high 30s psi, but the number on THIS truck's placard is the one that matters -- not a number repeated online.",
  offRoadPressureNote:
    "Ford does not publish a separate off-road tire pressure. Airing down is a technique the driver chooses based on terrain (softer for traction and ride on rock/sand/snow, at the cost of sidewall protection and handling), not a manufacturer-specified number. There is no single 'right' off-road PSI for this truck.",
  tpmsNote:
    'Direct TPMS with a sensor in each wheel; the warning tells you at least one tire is meaningfully below placard pressure, not which one or by how much -- carry a gauge.',
  repairKitNote:
    'Airing down and back up needs a compressor and a gauge you trust, not just the dash warning light. A plug kit handles most punctures in the field; a sidewall cut on a 35 is a spare-tire problem, not a plug-kit problem.',
  sources: ['ford_bronco', 'bronco6g'],
  lastChecked: CHECKED,
}

/**
 * The rooftop tent's exact model is not established, so nothing here claims a
 * spec for it. This is generic, safety-relevant sequence, not a product page.
 */
export const ROOF_TENT_PHASES: RoofTentPhase[] = [
  {
    title: 'Before leaving',
    items: [
      'Tent itself latched/secured for travel, per its own manual',
      'Mounting hardware (crossbars, tent-to-rack mounts) checked snug',
      'Ladder secured for travel',
      'Loose gear inside and on the roof secured -- nothing that can shift or fly off',
      'Doors and windows secured',
      'Roof-top load considered against the vehicle’s roof load rating and your other cargo',
    ],
  },
  {
    title: 'Setting up',
    items: [
      'Pick a site that is actually suitable for a rooftop tent -- clearance above and around the vehicle',
      'Park on reasonably level ground; use leveling blocks if it is close',
      'Check wind and weather before committing to the spot',
      'Confirm you are legally allowed to be there -- see this app’s camping notes and the signs on the ground',
    ],
  },
  {
    title: 'Before driving away',
    items: [
      'Tent fully closed and latched',
      'Ladder stowed',
      'Straps/mounts re-checked secure',
      'Loose gear cleared off the roof and out of the way of doors',
      'Windows and doors secured',
    ],
  },
]

export const PRE_ADVENTURE_CHECKLIST: PreAdventureChecklistItem[] = [
  { id: 'fuel', label: 'Fuel' },
  { id: 'weather', label: 'Weather checked' },
  { id: 'conditions', label: 'Road/trail conditions checked' },
  { id: 'tires', label: 'Tires checked' },
  { id: 'spare', label: 'Spare checked' },
  { id: 'compressor', label: 'Compressor' },
  { id: 'recovery', label: 'Recovery gear' },
  { id: 'water', label: 'Water' },
  { id: 'food', label: 'Food' },
  { id: 'firstaid', label: 'First aid' },
  { id: 'nav', label: 'Navigation available (offline map/paper)' },
  { id: 'comms', label: 'Emergency communication' },
  { id: 'rooftent', label: 'Roof tent secured' },
  { id: 'plan', label: 'Someone knows the plan' },
]
