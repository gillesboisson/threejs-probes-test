import { SphereGeometry } from 'three'
import { ProbeMeshMaterial } from './ProbeMeshMaterial'

export const probeMeshGeom = new SphereGeometry(0.5, 16, 16)

export class ReflectionProbeMaterial extends ProbeMeshMaterial {}


