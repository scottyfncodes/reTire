import type { Stop } from './types'

const CHECKED = '2026-09-18'

export const STOPS: Stop[] = [
  {
    id: 'animas_forks',
    name: 'Animas Forks ghost town',
    kind: 'ghost_town',
    dwellMinutes: 45,
    blurb:
      'One of the highest mining camps in North America, founded 1875 and empty by the 1920s. Seven buildings have been stabilised by the BLM and the San Juan County Historical Society -- new roofs, windows, doors and drainage, so what you walk through is standing on purpose.',
    lat: 37.9294,
    lon: -107.5717,
    elevationFt: { min: 11185, max: 11200 },
    sources: ['blm_animas_forks', 'wikipedia'],
    lastChecked: CHECKED,
  },
  {
    id: 'engineer_pass_summit',
    name: 'Engineer Pass summit',
    kind: 'overlook',
    dwellMinutes: 20,
    blurb:
      'A 12,800 ft saddle on the Alpine Loop with the whole northern San Juan range laid out. This is the half of the loop that actually demands the truck.',
    lat: 37.9722,
    lon: -107.5333,
    elevationFt: 12800,
    sources: ['blm_alpine_loop'],
    lastChecked: CHECKED,
  },
  {
    id: 'cinnamon_pass_summit',
    name: 'Cinnamon Pass summit',
    kind: 'overlook',
    dwellMinutes: 20,
    blurb:
      'The 12,640 ft eastern gate of the Alpine Loop, dropping toward Lake City. High-clearance 4WD with low range, same as Engineer.',
    lat: 37.9339,
    lon: -107.5361,
    elevationFt: 12640,
    sources: ['blm_alpine_loop'],
    lastChecked: CHECKED,
  },
  {
    id: 'ophir_pass_summit',
    name: 'Ophir Pass summit',
    kind: 'overlook',
    dwellMinutes: 20,
    blurb:
      'About 11,800 ft on a shelf road above the Upper Ophir valley. Loose rock, steep grades and a narrow shelf on the Ophir side -- the exposure, not the traction, is the story.',
    lat: 37.8514,
    lon: -107.7897,
    elevationFt: 11800,
    sources: ['alltrails'],
    lastChecked: CHECKED,
  },
  {
    id: 'molas_pass_overlook',
    name: 'Molas Pass overlook',
    kind: 'scenic',
    dwellMinutes: 15,
    blurb:
      'Paved pullout at 10,910 ft on US 550 looking into the Grenadier Range and down the Animas gorge. The best scenery-to-effort ratio in the county.',
    lat: 37.7461,
    lon: -107.7111,
    elevationFt: 10910,
    sources: ['codot_byways'],
    lastChecked: CHECKED,
  },
  {
    id: 'silverton',
    name: 'Silverton',
    kind: 'town',
    dwellMinutes: 45,
    blurb:
      'A 9,300 ft mining town at the head of the Animas, and the hinge every San Juan route turns on. Note: Avalanche Brewing, the long-standing brewpub here, is reported permanently closed -- do not plan the beer stop around it.',
    lat: 37.8119,
    lon: -107.6645,
    elevationFt: 9318,
    sources: ['sanjuancountyco', 'wikipedia'],
    lastChecked: CHECKED,
  },
  {
    id: 'red_mountain_district',
    name: 'Red Mountain mining district',
    kind: 'mine',
    dwellMinutes: 30,
    blurb:
      'The oxidised red slopes and surviving headframes between Silverton and Ouray on US 550 -- among the most photographed industrial ruins in Colorado, visible from the highway.',
    lat: 37.8969,
    lon: -107.7117,
    elevationFt: 11018,
    sources: ['codot_byways', 'wikipedia'],
    lastChecked: CHECKED,
  },
  {
    id: 'chimney_rock',
    name: 'Chimney Rock National Monument',
    kind: 'historic',
    dwellMinutes: 120,
    blurb:
      'An ancestral Puebloan great house site aligned to the northern lunar standstill, on a high mesa between two rock spires. Guided Great House tours and self-guided access run in season.',
    lat: 37.1928,
    lon: -107.3033,
    elevationFt: 7600,
    sources: ['cria', 'sjnf'],
    lastChecked: CHECKED,
  },
  {
    id: 'mesa_verde_chapin',
    name: 'Mesa Verde -- Chapin Mesa',
    kind: 'historic',
    dwellMinutes: 180,
    blurb:
      'Cliff dwellings, the museum and the mesa-top loops. The drive in from the entrance is long and slow by design -- budget for it.',
    lat: 37.1836,
    lon: -108.4879,
    elevationFt: 6900,
    sources: ['nps_meve'],
    lastChecked: CHECKED,
  },
  {
    id: 'andrews_lake',
    name: 'Andrews Lake',
    kind: 'water',
    dwellMinutes: 20,
    blurb:
      'Paved day-use area at 10,770 ft just south of Molas Pass. Trailhead for Crater Lake and a fine place to do nothing.',
    lat: 37.7378,
    lon: -107.7053,
    elevationFt: 10770,
    sources: ['sjnf'],
    lastChecked: CHECKED,
  },
  {
    id: 'old_lime_creek_road',
    name: 'Old Lime Creek Road (FR 591)',
    kind: 'scenic',
    dwellMinutes: null,
    blurb:
      'The original pre-1950s highway alignment between Durango and Silverton -- rough, rocky, narrow, and a far better drive than the pavement it was replaced by.',
    lat: 37.6425,
    lon: -107.7856,
    elevationFt: 9200,
    sources: ['sjnf', 'durango_trails'],
    lastChecked: CHECKED,
  },
  {
    id: 'la_plata_mining',
    name: 'La Plata Canyon mining remains',
    kind: 'mine',
    dwellMinutes: 30,
    blurb:
      'Scattered mill and mine remains up the canyon toward Kennebec. Mixed private and public ground -- look from the road, the posting is real.',
    lat: 37.3862,
    lon: -108.0503,
    elevationFt: 9000,
    sources: ['sjnf', 'laplata_county'],
    lastChecked: CHECKED,
  },
  {
    id: 'durango_train_yard',
    name: 'Durango & Silverton roundhouse and yard',
    kind: 'historic',
    dwellMinutes: 60,
    blurb:
      'A working 1880s narrow-gauge railroad with its original roundhouse in downtown Durango. Coal smoke, in 2026, on a schedule.',
    lat: 37.2689,
    lon: -107.8806,
    elevationFt: 6512,
    sources: ['dsngrr'],
    lastChecked: CHECKED,
  },
]

export const STOPS_BY_ID: Record<string, Stop> = Object.fromEntries(
  STOPS.map((s) => [s.id, s]),
)
