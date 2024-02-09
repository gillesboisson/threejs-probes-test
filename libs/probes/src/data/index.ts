export * from './type'

import { LightMapGroupJSON } from './lightMap'
import { AnyProbeVolumeJSON } from './probeVolume'
import { VisibilityDefinition } from './type'

export * from './probeVolume'
export * from './lightMap'

export type BakingJSON = {
  probes: AnyProbeVolumeJSON[]
  baked_maps: LightMapGroupJSON[]
  collections: VisibilityDefinition[]
}