import { Vector3 } from 'three'
import { ReflectionVolumeData } from '../data'
import { ProbeRatioLod } from '../type'
import { ReflectionProbeVolume } from './ReflectionProbeVolume'
import { ProbeVolumeRatio } from './type'
import { ProbeVolumeGroup } from './ProbeVolumeGroup'
import { Probe } from '../Probe'

export class ReflectionProbeVolumeGroup extends ProbeVolumeGroup<
  ReflectionProbeVolume,
  ReflectionVolumeData,
  'reflection'
> {
  getSuroundingProbes(
    position: Vector3,
    out: ProbeRatioLod[] = [],
    outProbeVolumeRatio: ProbeVolumeRatio<ReflectionProbeVolume>[] = [],
    roughness: number = 0
  ): ProbeRatioLod[] {
    let resultIndex = 0

    this.getGlobalRatio(position, outProbeVolumeRatio)
    let totalProbeRatio = 0
    for (let i = 0; i < outProbeVolumeRatio.length; i++) {
      const [probeVolume, probeRatio] = outProbeVolumeRatio[i]
      totalProbeRatio += probeRatio
      const nbProbes = probeVolume.getSuroundingProbes(
        position,
        probeRatio,
        out,
        resultIndex
      )

      probeVolume.probeRatioToProbeRatioLod(roughness, out, nbProbes, out)

      resultIndex += nbProbes
    }

    if (totalProbeRatio < 1 && this.fallbackVolume !== null) {
      out[resultIndex] = [
        this.fallbackVolume.reflectionCubeProbe,
        1 - totalProbeRatio,
        this.fallbackVolume.roughnessToTextureLod(roughness),
      ]
      resultIndex++
    }

    out.splice(resultIndex, out.length - resultIndex)

    return out
  }
}
