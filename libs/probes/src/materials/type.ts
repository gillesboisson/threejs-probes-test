import { MeshProbeLambertMaterial } from './MeshProbeLambertMaterial';
import { MeshProbePhongMaterial } from './MeshProbePhongMaterial';
import { MeshProbePhysicalMaterial } from './MeshProbePhysicalMaterial';
import { MeshProbeStandardMaterial } from './ProbeMeshStandardMaterial';
import { IProbeMaterial } from './extendProbesMaterial';

export type AnyMeshProbeMaterial =
  (| MeshProbePhongMaterial
  | MeshProbePhysicalMaterial
  | MeshProbeLambertMaterial
  | MeshProbeStandardMaterial
  | MeshProbePhysicalMaterial) & IProbeMaterial;
