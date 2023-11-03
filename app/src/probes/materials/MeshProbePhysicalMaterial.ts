import { MeshPhysicalMaterial } from 'three';
import { extendProbesMaterial } from './extendProbesMaterial';

export class MeshProbePhysicalMaterial extends extendProbesMaterial<MeshPhysicalMaterial>(
  MeshPhysicalMaterial
) {
  name = 'MeshProbePhysicalMaterial';
}
