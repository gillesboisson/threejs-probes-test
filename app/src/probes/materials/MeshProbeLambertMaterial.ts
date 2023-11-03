import { MeshLambertMaterial } from 'three';
import { extendProbesMaterial } from './extendProbesMaterial';

export class MeshProbeLambertMaterial extends extendProbesMaterial<MeshLambertMaterial>(
  MeshLambertMaterial
) {
  name = 'MeshProbeLambertMaterial';
}
