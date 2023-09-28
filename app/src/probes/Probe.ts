import {
  CubeTexture,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'

export type Probe = Readonly<{
  position: Vector3
  infuence: [Vector3, Vector3]
  texture: CubeTexture
}>
