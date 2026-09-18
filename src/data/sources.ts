import type { Source } from './types'

/**
 * Every fact in this app points at one of these. If something cannot be
 * attributed, it is stored as UNKNOWN instead of being written down.
 */
export const SOURCES: Record<string, Source> = {
  sjnf: {
    id: 'sjnf',
    label: 'San Juan National Forest',
    org: 'USDA Forest Service',
    url: 'https://www.fs.usda.gov/r02/sanjuan',
    kind: 'agency',
  },
  sjnf_alerts: {
    id: 'sjnf_alerts',
    label: 'San Juan NF alerts & closures',
    org: 'USDA Forest Service',
    url: 'https://www.fs.usda.gov/r02/sanjuan/alerts',
    kind: 'agency',
  },
  blm_alpine_loop: {
    id: 'blm_alpine_loop',
    label: 'Alpine Loop Back Country Byway',
    org: 'Bureau of Land Management',
    url: 'https://www.blm.gov/visit/alpine-loop',
    kind: 'agency',
  },
  blm_animas_forks: {
    id: 'blm_animas_forks',
    label: 'Animas Forks',
    org: 'Bureau of Land Management',
    url: 'https://www.blm.gov/visit/animas-forks',
    kind: 'agency',
  },
  nps_meve: {
    id: 'nps_meve',
    label: 'Mesa Verde National Park',
    org: 'National Park Service',
    url: 'https://www.nps.gov/meve/index.htm',
    kind: 'agency',
  },
  nps_meve_fees: {
    id: 'nps_meve_fees',
    label: 'Mesa Verde fees & passes',
    org: 'National Park Service',
    url: 'https://www.nps.gov/meve/planyourvisit/fees.htm',
    kind: 'agency',
  },
  cotrip: {
    id: 'cotrip',
    label: 'COtrip road conditions',
    org: 'Colorado Dept. of Transportation',
    url: 'https://www.cotrip.org/',
    kind: 'agency',
  },
  codot_byways: {
    id: 'codot_byways',
    label: 'Colorado Scenic & Historic Byways',
    org: 'Colorado Dept. of Transportation',
    url: 'https://www.codot.gov/travel/coloradobyways',
    kind: 'agency',
  },
  recgov: {
    id: 'recgov',
    label: 'Recreation.gov',
    org: 'US Federal Recreation',
    url: 'https://www.recreation.gov/',
    kind: 'agency',
  },
  sjma: {
    id: 'sjma',
    label: 'San Juan Mountains Association',
    org: 'SJMA (USFS/BLM partner)',
    url: 'https://sjma.org/',
    kind: 'operator',
  },
  durango_trails: {
    id: 'durango_trails',
    label: 'Durango Trails',
    org: 'Durango Trails (Trails 2000)',
    url: 'https://www.durangotrails.org/',
    kind: 'operator',
  },
  sanjuancountyco: {
    id: 'sanjuancountyco',
    label: 'San Juan County, Colorado',
    org: 'San Juan County',
    url: 'https://www.sanjuancolorado.us/',
    kind: 'agency',
  },
  laplata_county: {
    id: 'laplata_county',
    label: 'La Plata County roads',
    org: 'La Plata County',
    url: 'https://www.laplatacountyco.gov/',
    kind: 'agency',
  },
  cria: {
    id: 'cria',
    label: 'Chimney Rock Interpretive Association',
    org: 'CRIA',
    url: 'https://www.chimneyrockco.org/',
    kind: 'operator',
  },
  open_meteo: {
    id: 'open_meteo',
    label: 'Open-Meteo forecast API',
    org: 'Open-Meteo',
    url: 'https://open-meteo.com/',
    kind: 'reference',
  },
  ska: {
    id: 'ska',
    label: 'Ska Brewing',
    org: 'Ska Brewing Co.',
    url: 'https://skabrewing.com/',
    kind: 'operator',
  },
  steamworks: {
    id: 'steamworks',
    label: 'Steamworks Brewing',
    org: 'Steamworks Brewing Co.',
    url: 'https://steamworksbrewing.com/',
    kind: 'operator',
  },
  carver: {
    id: 'carver',
    label: 'Carver Brewing',
    org: 'Carver Brewing Co.',
    url: 'https://carverbrewing.com/',
    kind: 'operator',
  },
  animas_brewing: {
    id: 'animas_brewing',
    label: 'Animas Brewing',
    org: 'Animas Brewing Co.',
    url: 'https://www.animasbrewing.com/',
    kind: 'operator',
  },
  riffraff: {
    id: 'riffraff',
    label: 'Riff Raff Brewing',
    org: 'Riff Raff Brewing Co.',
    url: 'https://www.riffraffbrewing.com/',
    kind: 'operator',
  },
  mancos_brewing: {
    id: 'mancos_brewing',
    label: 'Mancos Brewing',
    org: 'Mancos Brewing Co.',
    url: 'https://mancosbrewingcompany.com/',
    kind: 'operator',
  },
  ourayco: {
    id: 'ourayco',
    label: 'City of Ouray visitor info',
    org: 'City of Ouray',
    url: 'https://www.ouraycolorado.com/',
    kind: 'agency',
  },
  dsngrr: {
    id: 'dsngrr',
    label: 'Durango & Silverton Narrow Gauge Railroad',
    org: 'D&SNG',
    url: 'https://www.durangotrain.com/',
    kind: 'operator',
  },
  usgs_gnis: {
    id: 'usgs_gnis',
    label: 'USGS Geographic Names / topo',
    org: 'US Geological Survey',
    url: 'https://www.usgs.gov/',
    kind: 'agency',
  },
  wikipedia: {
    id: 'wikipedia',
    label: 'Wikipedia',
    org: 'Wikimedia',
    url: 'https://en.wikipedia.org/',
    kind: 'reference',
  },
  alltrails: {
    id: 'alltrails',
    label: 'AllTrails community data',
    org: 'AllTrails',
    url: 'https://www.alltrails.com/',
    kind: 'community',
  },
  hikingproject: {
    id: 'hikingproject',
    label: 'Hiking Project',
    org: 'onX / Hiking Project',
    url: 'https://www.hikingproject.com/',
    kind: 'community',
  },
  durango_herald: {
    id: 'durango_herald',
    label: 'The Durango Herald',
    org: 'Durango Herald',
    url: 'https://www.durangoherald.com/',
    kind: 'reference',
  },
  fire_restrictions: {
    id: 'fire_restrictions',
    label: 'Colorado fire restrictions & bans',
    org: 'Colorado Div. of Fire Prevention & Control',
    url: 'https://dfpc.colorado.gov/fire-restrictions-and-bans',
    kind: 'agency',
  },
}

export function sourcesFor(ids: string[]): Source[] {
  return ids.map((id) => SOURCES[id]).filter((s): s is Source => Boolean(s))
}

/** Highest-trust kind present, used to badge a fact in the UI. */
export function trustOf(ids: string[]): SourceKind | 'none' {
  const order: SourceKind[] = ['agency', 'operator', 'reference', 'community']
  for (const kind of order) {
    if (ids.some((id) => SOURCES[id]?.kind === kind)) return kind
  }
  return 'none'
}

type SourceKind = Source['kind']
