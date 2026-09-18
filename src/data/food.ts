import type { FoodStop } from './types'

const CHECKED = '2026-09-18'

/**
 * Hours are the single most volatile fact in this app, so they are stored as a
 * labelled note with a check date rather than as truth, and the UI always
 * offers the phone number and site. A place known to have closed stays in the
 * list with `closed` set, so the recommender can never resurrect it.
 */
export const FOOD: FoodStop[] = [
  {
    id: 'ska',
    name: 'Ska Brewing World Headquarters',
    kind: 'brewery',
    town: 'Durango',
    address: '225 Girard St, Durango, CO 81303',
    url: 'https://skabrewing.com/',
    phone: null,
    hoursNote: 'Reported Tue-Sat, around 11am-8pm (checked 2026-09-18). Confirm before you count on it.',
    closed: null,
    lat: 37.2402,
    lon: -107.8722,
    sources: ['ska'],
    lastChecked: CHECKED,
  },
  {
    id: 'steamworks',
    name: 'Steamworks Brewing Company',
    kind: 'brewpub',
    town: 'Durango',
    address: '801 E 2nd Ave, Durango, CO 81301',
    url: 'https://steamworksbrewing.com/',
    phone: null,
    hoursNote:
      'Reported open daily from 11am, late on Friday and Saturday (checked 2026-09-18). Confirm before you count on it.',
    closed: null,
    lat: 37.2775,
    lon: -107.8781,
    sources: ['steamworks'],
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
    hoursNote: 'Hours not verified. Carver also does breakfast -- useful on the way out, not just back.',
    closed: null,
    lat: 37.274,
    lon: -107.8805,
    sources: ['carver'],
    lastChecked: CHECKED,
  },
  {
    id: 'animas_brewing',
    name: 'Animas Brewing Company',
    kind: 'brewpub',
    town: 'Durango',
    address: '1560 E 2nd Ave, Durango, CO 81301',
    url: 'https://www.animasbrewing.com/',
    phone: null,
    hoursNote:
      'Reported 11am-9pm Tue/Wed/Thu/Sun, to 10pm Fri/Sat (checked 2026-09-18). Confirm before you count on it.',
    closed: null,
    lat: 37.2841,
    lon: -107.876,
    sources: ['animas_brewing'],
    lastChecked: CHECKED,
  },
  {
    id: 'riffraff',
    name: 'Riff Raff on the Rio',
    kind: 'brewpub',
    town: 'Pagosa Springs',
    address: '356 E Pagosa St, Pagosa Springs, CO 81147',
    url: 'https://www.riffraffbrewing.com/',
    phone: '970-264-6274',
    hoursNote:
      'Riff Raff consolidated to the riverside location; hours not verified. Call ahead.',
    closed: null,
    lat: 37.2683,
    lon: -107.0097,
    sources: ['riffraff'],
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
    hoursNote: 'Hours not verified. Call ahead.',
    closed: null,
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
    // these routes, and this is the trap. Reported closed 2025-03-30.
    closed: 'Reported permanently closed on 2025-03-30.',
    lat: 37.8119,
    lon: -107.6645,
    sources: ['wikipedia'],
    lastChecked: CHECKED,
  },
]

export const FOOD_BY_ID: Record<string, FoodStop> = Object.fromEntries(
  FOOD.map((f) => [f.id, f]),
)

/** Only places we have no reason to believe are closed. */
export const OPEN_FOOD = FOOD.filter((f) => f.closed === null)
