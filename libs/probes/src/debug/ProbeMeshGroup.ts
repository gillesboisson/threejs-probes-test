import { Group } from 'three'
import { Probe, ReflectionProbe } from '../handlers/Probe'
import { IrradianceProbeMesh } from './IrradianceProbeMesh'
import { ReflectionProbeMesh } from './ReflectionProbeMesh'
import {
  ProbeVolume,
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
          this.add(new ReflectionProbeMesh(probe))
          break
        default:
          throw new Error('Unknown probe type')
      }
    })
  }
}


