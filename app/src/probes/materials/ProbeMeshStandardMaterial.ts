import { MeshStandardMaterial, MeshStandardMaterialParameters } from 'three'
import { shaderReplaceInclude } from './utils'
import { extendProbesMaterial } from './extendProbesMaterial'
import { ProbeVolumeHandler } from '../ProbeVolumeHandler'

export class MeshProbeStandardMaterial extends extendProbesMaterial<MeshStandardMaterial>(
  MeshStandardMaterial
) {
  name = 'MeshProbeStandardMaterial'

  // protect params from being changed ignoring in super constructor
  // constructor(probeVolumeHander: ProbeVolumeHandler, pa) {
  //   super(probeVolumeHander)
  // }
}
