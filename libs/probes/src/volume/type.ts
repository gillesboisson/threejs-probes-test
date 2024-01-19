import { Vector3 } from 'three'
import { Probe } from '../handlers/Probe'
import { ProbeRatio } from '../type'
import { AnyProbeVolume } from './ProbeVolume'

export type UseGetSuroundingProbes = {
  getSuroundingProbes(
    position: Vector3,
    volumeRatio: number,
    result: ProbeRatio[],
    offset?: number
  ): number

  getGlobalRatio(position: Vector3): number
}

export type ProbeVolumeRatio<VolumeT extends AnyProbeVolume = AnyProbeVolume> =
  [VolumeT, number]
