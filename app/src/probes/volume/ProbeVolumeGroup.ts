import { Box3, Vector3 } from 'three'
import {
  AnyProbeVolumeData,
  IrradianceVolumeData,
  ReflectionVolumeData,
} from '../data'
import { ProbeType, ProbeRatio, ProbeRatioLod } from '../type'
import { IrradianceProbeVolume } from './IrradianceProbeVolume'
import { ProbeVolume, AnyProbeVolume } from './ProbeVolume'
import { ReflectionProbeVolume } from './ReflectionProbeVolume'
import { ProbeVolumeRatio } from './type'

export class ProbeVolumeGroup<
  ProbeVolumeT extends ProbeVolume<DataT, TypeT>,
  DataT extends AnyProbeVolumeData,
  TypeT extends ProbeType
> {
  protected _bounds = new Box3()
  protected _boundsDirty = true

  readonly volumes: ProbeVolumeT[] = []

  get bounds(): Box3 {
    if (this._boundsDirty) {
      this.computeBounds()
      this._boundsDirty = false
    }
    return this._bounds
  }

  addVolume(volume: ProbeVolumeT) {
    if (!this.volumes.includes(volume)) {
      this.volumes.push(volume)
      this._boundsDirty = true
    }
  }

  getGlobalRatio(
    position: Vector3,
    out: ProbeVolumeRatio<ProbeVolumeT>[] = []
  ): ProbeVolumeRatio<ProbeVolumeT>[] {
    if (this.bounds.containsPoint(position) === false) {
      out.length = 0
      return out
    }

    let matchedVolumes = 0
    let totalRatio = 0

    // get all the volumes that match
    for (let i = 0; i < this.volumes.length; i++) {
      const volume = this.volumes[i]
      const ratio = volume.getGlobalRatio(position)
      if (ratio > 0) {
        totalRatio += ratio
        if (out[matchedVolumes] === undefined) {
          out[matchedVolumes] = [volume, ratio]
        } else {
          out[matchedVolumes][0] = volume
          out[matchedVolumes][1] = ratio
        }
        matchedVolumes++
      }
    }

    out.splice(matchedVolumes, out.length - matchedVolumes)

    // normalize the ratios
    for (let i = 0; i < matchedVolumes; i++) {
      out[i][1] /= totalRatio
    }

    return out
  }

  getSuroundingProbes(
    position: Vector3,
    out: ProbeRatio[] = [],
    outProbeVolumeRatio: ProbeVolumeRatio<ProbeVolumeT>[] = []
  ): ProbeRatio[] {
    let resultIndex = 0

    this.getGlobalRatio(position, outProbeVolumeRatio)
    for (let i = 0; i < outProbeVolumeRatio.length; i++) {
      const [probeVolume, probeRatio] = outProbeVolumeRatio[i]

      resultIndex += probeVolume.getSuroundingProbes(
        position,
        probeRatio,
        out,
        resultIndex
      )
    }

    out.splice(resultIndex, out.length - resultIndex)

    return out
  }

  removeVolume(volume: ProbeVolumeT) {
    const index = this.volumes.indexOf(volume)
    if (index !== -1) {
      this.volumes.splice(index, 1)
      this._boundsDirty = true
    }
  }

  protected computeBounds() {
    this._bounds.makeEmpty()
    for (const volume of this.volumes) {
      this._bounds.union(volume.bounds)
    }
  }
}

export type AnyProbeVolumeGroup = ProbeVolumeGroup<
  AnyProbeVolume,
  AnyProbeVolumeData,
  ProbeType
>

export class IrradianceProbeVolumeGroup extends ProbeVolumeGroup<
  IrradianceProbeVolume,
  IrradianceVolumeData,
  'irradiance'
> {}

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
    for (let i = 0; i < outProbeVolumeRatio.length; i++) {
      const [probeVolume, probeRatio] = outProbeVolumeRatio[i]

      const nbProbes = probeVolume.getSuroundingProbes(
        position,
        probeRatio,
        out,
        resultIndex
      )

      probeVolume.probeRatioToProbeRatioLod(roughness, out, nbProbes, out)

      resultIndex += nbProbes
    }

    out.splice(resultIndex, out.length - resultIndex)

    return out
  }
}
