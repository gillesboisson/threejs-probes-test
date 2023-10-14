import { AnyProbeVolume } from './ProbeVolume'

export type ProbeVolumeRatio<VolumeT extends AnyProbeVolume = AnyProbeVolume> =
  [VolumeT, number]
