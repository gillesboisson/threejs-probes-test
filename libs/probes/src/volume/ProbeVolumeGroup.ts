import { Box3, Vector3 } from 'three';
import { AnyProbeVolumeBaking, AnyProbeVolumeData } from '../data';
import { ProbeType, ProbeRatio } from '../type';
import { ProbeVolume, AnyProbeVolume } from './ProbeVolume';
import { ProbeVolumeRatio,  } from './type';
import { Probe } from '../type';
import { GlobalEnvVolume } from './GlobalEnvVolume';

export class ProbeVolumeGroup<
  ProbeVolumeT extends ProbeVolume<DataT, BakingT, TypeT>,
  DataT extends AnyProbeVolumeData,
  BakingT extends AnyProbeVolumeBaking,
  TypeT extends ProbeType
> {
  protected _bounds = new Box3();
  protected _boundsDirty = true;

  fallbackVolume: GlobalEnvVolume | null = null;
  // fallbackProbe: Probe | null = null

  readonly volumes: ProbeVolumeT[] = [];

  get bounds(): Box3 {
    if (this._boundsDirty) {
      this.computeBounds();
      this._boundsDirty = false;
    }
    return this._bounds;
  }

  addVolume(volume: ProbeVolumeT) {
    if (!this.volumes.includes(volume)) {
      this.volumes.push(volume);
      this._boundsDirty = true;
    }
  }

  getClosestProbe(
    position: Vector3
  ): (Probe & { volume?: ProbeVolumeT }) | null {
    let closestProbe: Probe | null = null;
    let closestDistance = Infinity;
    let closestVolume: ProbeVolumeT | null = null;
    for (let i = 0; i < this.volumes.length; i++) {
      const volume = this.volumes[i];
      if (volume.bounds.containsPoint(position) !== false) {
        const probe = volume.getClosestProbe(position);

        if (probe !== null) {
          const distance = probe.position.distanceTo(position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestProbe = probe;
            closestVolume = volume;
          }
        }
      }
    }

    return { ...closestProbe, volume: closestVolume };
  }

  getGlobalRatio(
    position: Vector3,
    out: ProbeVolumeRatio<ProbeVolumeT>[] = []
  ): ProbeVolumeRatio<ProbeVolumeT>[] {
    if (this.bounds.containsPoint(position) === false) {
      out.length = 0;
      return out;
    }

    let matchedVolumes = 0;
    let totalRatio = 0;

    // get all the volumes that match
    for (let i = 0; i < this.volumes.length; i++) {
      const volume = this.volumes[i];
      const ratio = volume.getGlobalRatio(position);
      if (ratio > 0) {
        totalRatio += ratio;
        if (out[matchedVolumes] === undefined) {
          out[matchedVolumes] = [volume, ratio];
        } else {
          out[matchedVolumes][0] = volume;
          out[matchedVolumes][1] = ratio;
        }
        matchedVolumes++;
      }
    }

    out.splice(matchedVolumes, out.length - matchedVolumes);

    // if ratio < 1, total ratio need to take fallback probe into account
    if (totalRatio < 1 && this.fallbackVolume !== null) {
      totalRatio = 1;
    }

    // normalize the ratios
    for (let i = 0; i < matchedVolumes; i++) {
      out[i][1] /= totalRatio;
    }

    return out;
  }

  getSuroundingProbes(
    position: Vector3,
    out: ProbeRatio[] = [],
    outProbeVolumeRatio: ProbeVolumeRatio<ProbeVolumeT>[] = []
  ): ProbeRatio[] {
    let resultIndex = 0;

    this.getGlobalRatio(position, outProbeVolumeRatio);
    let totalProbeRatio = 0;
    for (let i = 0; i < outProbeVolumeRatio.length; i++) {
      const [probeVolume, probeRatio] = outProbeVolumeRatio[i];
      resultIndex = probeVolume.getSuroundingProbes(
        position,
        probeRatio,
        out,
        resultIndex
      );

      totalProbeRatio += probeRatio;
    }

    // console.log('totalProbeRatio',totalProbeRatio);

    if (totalProbeRatio < 1 && this.fallbackVolume !== null) {
      out[resultIndex] = [
        this.fallbackVolume.irradianceCubeProbe,
        1 - totalProbeRatio,
      ];
      resultIndex++;
    }

    out.length = resultIndex;

    return out;
  }

  removeVolume(volume: ProbeVolumeT) {
    const index = this.volumes.indexOf(volume);
    if (index !== -1) {
      this.volumes.splice(index, 1);
      this._boundsDirty = true;
    }
  }

  protected computeBounds() {
    this._bounds.makeEmpty();
    for (const volume of this.volumes) {
      this._bounds.union(volume.bounds);
    }
  }
}

export type AnyProbeVolumeGroup = ProbeVolumeGroup<
  AnyProbeVolume,
  AnyProbeVolumeData,
  AnyProbeVolumeBaking,
  ProbeType
>;
