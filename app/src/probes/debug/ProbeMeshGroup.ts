import { Group, LineBasicMaterial } from 'three'
import { Probe, ReflectionProbe } from '../Probe'
import { IrradianceProbeMesh } from './IrradianceProbeMesh'
import { ReflectionProbeMesh } from './ReflectionProbeMesh'
import {
  createWireframeMeshFromIrradianceVolume,
  createWireframeMeshFromReflectionProbe,
} from './meshHelpers'
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ProbeVolume,
  ReflectionProbeVolume,
} from '../volume'

export class ProbeMeshGroup extends Group {
  constructor(readonly probes: Probe[]) {
    super()
    probes.forEach((probe) => {
      switch (probe.type) {
        case 'irradiance':
          this.add(new IrradianceProbeMesh(probe))
          break
        case 'reflection':
          console.log('probe', probe)
          this.add(new ReflectionProbeMesh(probe))
          break
        default:
          throw new Error('Unknown probe type')
      }
    })
  }
}

export class ProbeVolumeMeshGroup<
  ProbeVolumeT extends AnyProbeVolume
> extends Group {
  constructor(readonly probeVolume: ProbeVolumeT) {
    super()
  }
}

export class IrradianceProbeVolumeMeshGroup extends ProbeVolumeMeshGroup<IrradianceProbeVolume> {
  constructor(volume: IrradianceProbeVolume) {
    super(volume)
    createWireframeMeshFromIrradianceVolume(
      volume,
      new LineBasicMaterial({ color: 0xAAff00, linewidth: 1 }),
      this
    )

    volume.probes.forEach((probe) => {
      this.add(new IrradianceProbeMesh(probe))
    })
  }
}

export class ReflectionProbeVolumeMeshGroup extends ProbeVolumeMeshGroup<ReflectionProbeVolume> {
  constructor(volume: ReflectionProbeVolume) {
    super(volume)
    createWireframeMeshFromReflectionProbe(
      volume,
      new LineBasicMaterial({ color: 0x00ffAA, linewidth: 1 }),
      this
    )
  }
}
