import type { FoodStop } from './types'

const CHECKED = '2026-09-18'

/**
 * Hours are the single most volatile fact in this app, so they are stored as a
 * labelled note with a check date rather than as truth, and the UI always
 * offers the phone number and site. Every record also carries an explicit
 * `status` -- only `active` businesses may ever be offered as a current
 * recommendation. A place known to have closed (or gone seasonal, or
 * temporarily dark) stays in the list with that status and a reason, so the
 * recommender can never resurrect it and this app never has to special-case
 * one closure by name again.
 *
 * Verified against each business's own site/social presence, the relevant
 * area tourism/chamber source, and current third-party listings -- never
 * against a stale review alone. `sources` + `lastChecked` on each record ARE
 * the verification sources and verification date.
 */
export const FOOD: FoodStop[] = [
  {
    id: 'ska',
    name: 'Ska Brewing World Headquarters',
    kind: 'brewery',
    town: 'Durango',
    address: '225 Girard St, Durango, CO 81303',
    url: 'https://skabrewing.com/',
    phone: '970-247-5792',
    hoursNote:
      'Reported tasting room daily 11am-9pm, kitchen daily 11am-8pm (checked 2026-09-18). Confirm before you count on it.',
    status: 'active',
    seasonal: false,
    closureReason: null,
    reopeningDate: null,
    notes: null,
    lat: 37.2402,
    lon: -107.8722,
    sources: ['ska', 'visit_durango'],
    lastChecked: CHECKED,
  },
  {
    id: 'steamworks',
    name: 'Steamworks Brewing Company',
    kind: 'brewpub',
    town: 'Durango',
    address: '801 E 2nd Ave, Durango, CO 81301',
    url: 'https://steamworksbrewing.com/',
    phone: '970-259-9200',
    hoursNote:
      'Reported open daily from 11am, to around midnight Sun-Thu and later on Fri/Sat (checked 2026-09-18). Confirm before you count on it.',
    status: 'active',
    seasonal: false,
    closureReason: null,
    reopeningDate: null,
    notes: null,
    lat: 37.2775,
    lon: -107.8781,
    sources: ['steamworks', 'visit_durango'],
    lastChecked: CHECKED,
  },
  {
    id: 'carver',
    name: 'Carver Brewing Co.',
    kind: 'brewpub',
    town: 'Durango',
    address: '1022 Main Ave, Durango, CO 81301',
    url: 'https://carverbrewing.com/',
    phone: null,
    hoursNote:
      'Reported Mon-Wed 11am-9pm, Thu-Sat 11am-10pm, Sun 11am-9pm (checked 2026-09-18). Confirm before you count on it. Carver also does breakfast -- useful on the way out, not just back.',
    status: 'active',
    seasonal: false,
    closureReason: null,
    reopeningDate: null,
    notes: 'Marked its 40th year operating in 2026 -- a long-running Durango fixture, not a new or shaky listing.',
    lat: 37.274,
    lon: -107.8805,
    sources: ['carver', 'visit_durango'],
    lastChecked: CHECKED,
  },
  {
    id: 'animas_brewing',
    name: 'Animas Brewing Company',
    kind: 'brewpub',
    town: 'Durango',
    address: '1560 E 2nd Ave, Durango, CO 81301',
    url: 'https://www.animasbrewing.com/',
    phone: '970-403-8850',
    hoursNote:
      'Reported Mon 3-9pm, Tue-Sat 11am-9pm (checked 2026-09-18). Confirm before you count on it, and check before assuming Sunday hours.',
    status: 'active',
    seasonal: false,
    closureReason: null,
    reopeningDate: null,
    notes: null,
    lat: 37.2841,
    lon: -107.876,
    sources: ['animas_brewing', 'visit_durango'],
    lastChecked: CHECKED,
  },
  {
    id: 'riffraff',
    name: 'Riff Raff Brewing Co.',
    kind: 'brewpub',
    town: 'Pagosa Springs',
    address: '356 E Pagosa St, Pagosa Springs, CO 81147',
    url: 'https://www.riffraffbrewing.com/',
    phone: '970-264-6274',
    hoursNote: 'Reported open daily, roughly 11am-9pm (checked 2026-09-18). Confirm before you count on it.',
    status: 'active',
    seasonal: false,
    closureReason: null,
    reopeningDate: null,
    notes:
      'Previously listed here as "Riff Raff on the Rio"; current name across its own site and current listings is "Riff Raff Brewing Co." at the same riverside Pagosa St address.',
    lat: 37.2683,
    lon: -107.0097,
    sources: ['riffraff', 'pagosa_chamber'],
    lastChecked: CHECKED,
  },
  {
    id: 'mancos_brewing',
    name: 'Mancos Brewing Company',
    kind: 'brewery',
    town: 'Mancos',
    address: '484 E Frontage Rd, Mancos, CO 81328',
    url: 'https://mancosbrewingcompany.com/',
    phone: '970-533-9761',
    hoursNote:
      'Reported Mon/Wed/Thu 4-9pm, Fri 3-9pm, Sat 1-9pm, Sun 1-8pm, closed Tuesday (checked 2026-09-18). Confirm before you count on it.',
    status: 'active',
    seasonal: false,
    closureReason: null,
    reopeningDate: null,
    notes: null,
    lat: 37.348,
    lon: -108.276,
    sources: ['mancos_brewing'],
    lastChecked: CHECKED,
  },
  {
    id: 'avalanche_silverton',
    name: 'Avalanche Brewing Company',
    kind: 'brewpub',
    town: 'Silverton',
    address: '1151 Greene St, Silverton, CO 81433',
    url: null,
    phone: null,
    hoursNote: null,
    // Kept deliberately: Silverton looks like the obvious beer stop on half
    // these routes, and this is the trap. The `status` field, not this one
    // record, is what keeps it out of every recommendation surface.
    status: 'permanently_closed',
    seasonal: false,
    closureReason: 'Reported permanently closed on 2025-03-30; owners sold the business.',
    reopeningDate: null,
    notes:
      'The Greene St space reopened under new ownership as "Alpine Tavern," a different business -- not a reopening of Avalanche, and not added here as a recommendation.',
    lat: 37.8119,
    lon: -107.6645,
    sources: ['wikipedia', 'durango_herald'],
    lastChecked: CHECKED,
  },
]

export const FOOD_BY_ID: Record<string, FoodStop> = Object.fromEntries(
  FOOD.map((f) => [f.id, f]),
)

/** Only businesses currently confirmed operating -- the only status a recommendation may show. */
export const OPEN_FOOD = FOOD.filter((f) => f.status === 'active')
