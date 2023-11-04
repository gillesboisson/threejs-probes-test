import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
} from 'three'
import { shaderReplaceInclude } from './utils'
import { extendProbesMaterial } from './extendProbesMaterial'
import { ProbeVolumeHandler } from '../ProbeVolumeHandler'

export class MeshProbeStandardMaterial extends extendProbesMaterial<MeshStandardMaterial>(
  MeshStandardMaterial
) {
  
  

  // name = 'MeshProbeStandardMaterial'
}
// Not suported as envmap constant condition is implemented in meshbasic itself
class MeshProbeBasicMaterial extends extendProbesMaterial<MeshBasicMaterial>(
  MeshBasicMaterial
) {
  // name = 'MeshProbeBasicMaterial'
}
