import {
  CubeTexture,
  Vector3,
} from 'three'
import { ProbeType } from './type'

export type Probe = Readonly<{
  position: Vector3
  // infuence: [Vector3, Vector3]
  texture: CubeTexture,
  type: ProbeType
}>
