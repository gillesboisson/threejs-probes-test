import { Material, Mesh } from 'three'
import { Probe } from './handlers/Probe'

export type ProbeType = 'irradiance' | 'reflection' | 'global'
export type ProbeInfluenceType = 'BOX' | 'ELIPSOID'
export type ProbeRatio = [Probe, number, ...any]
export type ProbeRatioLod = [Probe, number, number]

export type HasObjectMapper<ObjectT extends Mesh = Mesh> = {

  filterMesh(object: ObjectT, material?: Material): boolean
  mapMaterial(object: ObjectT, material: Material): Material
  mapObject(object: ObjectT, material: Material): ObjectT

}