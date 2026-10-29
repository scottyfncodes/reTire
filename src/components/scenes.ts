import type { Adventure } from '../data/types'

/** The kinds of country a landscape can show; see Landscape.tsx. */
export type Scene = 'alpine' | 'basin' | 'pass' | 'mesa' | 'valley'

/** Which illustration each adventure gets. Unlisted places fall back to alpine. */
const SCENE_BY_ADVENTURE: Record<string, Scene> = {
  ice_lake_basin_day: 'basin',
  crater_lake_weminuche: 'basin',
  highland_mary_lakes_day: 'basin',
  south_mineral_overnight: 'alpine',
  engineer_mountain_day: 'alpine',
  alpine_loop_engineer: 'pass',
  kennebec_pass_bronco: 'pass',
  ophir_pass_crossing: 'pass',
  la_plata_overnight: 'pass',
  old_lime_creek_spud: 'pass',
  mesa_verde_day: 'mesa',
  chimney_rock_day: 'mesa',
  hermosa_shoulder: 'valley',
  animas_mountain_quick: 'valley',
}

export function sceneFor(adventure: Pick<Adventure, 'id'>): Scene {
  return SCENE_BY_ADVENTURE[adventure.id] ?? 'alpine'
}
