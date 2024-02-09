import { Material, Mesh } from 'three'

export type ProbeType = 'irradiance' | 'reflection' | 'global'
export type ProbeInfluenceType = 'BOX' | 'ELIPSOID'
export type ProbeRatio = [Probe, number, ...any]
export type ProbeRatioLod = [Probe, number, number, number, number]


export enum ProbeMode {
  Disabled = 0,
  Static = 1,
  FragmentRatio = 2,

  Nearest = 16,
}

export interface IProbeMaterial {
  readonly isProbeMaterial;
  probeMapMode: number;
  combine: number;
  probesIntensity: number;
  needsProbeUpdate: boolean;
  autoUpdateProbes: boolean;
  staticIrradianceProbe: Probe | null;
  staticReflectionProbe: Probe | null;
  reflectionProbeMode: ProbeMode;
  irradianceProbeMode: ProbeMode;
}

import {
  CubeTexture,
  Vector3,
} from 'three'


export type Probe = {
  position: Vector3
  texture: CubeTexture,
  type: ProbeType
}

export type RoughnessLodMapping = {
  startRoughness: number
  endRoughness: number
  nbLevels: number
}

export type ReflectionProbe = Probe & RoughnessLodMapping;


export type HasObjectMapper<ObjectT extends Mesh = Mesh> = {

  filterMesh(object: ObjectT, material?: Material): boolean
  mapMaterial(object: ObjectT, material: Material): Material
  mapObject(object: ObjectT, material: Material): ObjectT

}