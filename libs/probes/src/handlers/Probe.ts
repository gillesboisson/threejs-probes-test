import {
  CubeTexture,
  Vector3,
} from 'three'
import { ProbeType } from '../type'

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
