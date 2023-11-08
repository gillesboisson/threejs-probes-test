import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Uint16BufferAttribute,
  Vector3,
  WireframeGeometry,
} from 'three'
import { IrradianceProbeVolume, ReflectionProbeVolume } from '../volume'
import { BoxLineGeometry, SphereLineGeometry } from '../geometry'

const boxGeom = new BoxLineGeometry()
const sphereGeo = new SphereLineGeometry(0.5)

export function createWireframeMeshFromIrradianceVolume(
  volume: IrradianceProbeVolume,
  mat: LineBasicMaterial,
  group = new Group()
): Group {
  const scale = volume.scale
  const size = 1 + volume.data.influence_distance

  const insideSize = size - volume.data.influence_distance * volume.data.falloff

  const boxGeom = new BoxLineGeometry()

  const outsideMesh = new Line(boxGeom, mat)

  const insideMesh = new Line(boxGeom, mat)

  outsideMesh.name = 'bounds'
  insideMesh.name = 'falloff'

  outsideMesh.position.copy(volume.position)
  insideMesh.position.copy(volume.position)

  outsideMesh.scale.copy(scale).multiplyScalar(2 * size)
  insideMesh.scale.copy(scale).multiplyScalar(2 * insideSize)
  insideMesh.rotation.copy(volume.rotation)
  outsideMesh.rotation.copy(volume.rotation)

  group.add(outsideMesh)
  group.add(insideMesh)

  return group
}

export function createWireframeMeshFromReflectionProbe(
  volume: ReflectionProbeVolume,
  mat: LineBasicMaterial,
  group = new Group()
): Group {
  const scale = volume.scale
  const size = volume.data.influence_distance
  const insideSize = size - volume.data.influence_distance * volume.data.falloff
  let outsideMesh: Line
  let insideMesh: Line

  switch (volume.data.influence_type) {
    case 'BOX':
      outsideMesh = new Line(boxGeom, mat)
      insideMesh = new Line(boxGeom, mat)

      break
    case 'ELIPSOID':
      outsideMesh = new Line(sphereGeo, mat)
      insideMesh = new Line(sphereGeo, mat)

      break

    default:
      throw new Error('Invalid influence type')
      break
  }

  outsideMesh.scale.copy(scale).multiplyScalar(2 * size)
  insideMesh.scale.copy(scale).multiplyScalar(2 * insideSize)

  outsideMesh.position.copy(volume.position)
  insideMesh.position.copy(volume.position)

  outsideMesh.name = 'bounds'
  insideMesh.name = 'falloff'

  group.add(outsideMesh)
  group.add(insideMesh)

  return group
}
