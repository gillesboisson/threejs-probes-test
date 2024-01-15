export * from './type'

import { LightMapJSON } from './lightMap'
import { AnyProbeVolumeJSON } from './probeVolume'
import { VisibilityDefinition } from './type'

export * from './probeVolume'
export * from './lightMap'

export type BakingJSON = {
  probes: AnyProbeVolumeJSON[]
  baked_maps: LightMapJSON[]
  visibility_collections: VisibilityDefinition[]
}