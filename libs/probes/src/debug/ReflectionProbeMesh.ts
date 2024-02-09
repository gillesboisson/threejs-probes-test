import { SphereGeometry, Mesh } from 'three'
import { Probe } from '../type'
import { ReflectionProbeMeshMaterial } from './ReflectionProbeMeshMaterial'
import { probeMeshGeom } from './ProbeMesh'

export class ReflectionProbeMesh extends Mesh<
  SphereGeometry,
  ReflectionProbeMeshMaterial
> {
  constructor(readonly probe: Probe) {
    const mat = new ReflectionProbeMeshMaterial()
    mat.envMap = probe.texture
    super(probeMeshGeom, mat)
    this.scale.multiplyScalar(3)

    this.position.copy(probe.position)
  }
}


