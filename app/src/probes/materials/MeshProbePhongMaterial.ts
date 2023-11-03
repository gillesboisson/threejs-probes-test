import { MeshPhongMaterial } from 'three';
import { extendProbesMaterial } from './extendProbesMaterial';

export class MeshProbePhongMaterial extends extendProbesMaterial<MeshPhongMaterial>(
  MeshPhongMaterial
) {
  name = 'MeshProbePhongMaterial';
}
