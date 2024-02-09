import { IProbeMaterial } from '../type';

import { MeshLambertMaterial, MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { MeshProbeLambertMaterial } from './MeshProbeLambertMaterial';
import { MeshProbePhongMaterial } from './MeshProbePhongMaterial';
import { MeshProbePhysicalMaterial } from './MeshProbePhysicalMaterial';
import { MeshProbeStandardMaterial } from './ProbeMeshStandardMaterial';

export type AnyMeshProbeMaterial =
  (| MeshProbePhongMaterial
  | MeshProbePhysicalMaterial
  | MeshProbeLambertMaterial
  | MeshProbeStandardMaterial
  | MeshProbePhysicalMaterial) & IProbeMaterial;


export type ConvertibleMeshProbeMaterial =
    MeshPhongMaterial
    | MeshLambertMaterial
    | MeshStandardMaterial
    | MeshPhysicalMaterial


    