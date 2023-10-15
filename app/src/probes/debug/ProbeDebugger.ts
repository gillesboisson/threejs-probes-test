import { Group } from 'three'
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume'
import { IrradianceProbeVolumeMeshGroup } from './IrradianceProbeVolumeMeshGroup'
import { ReflectionProbeVolumeMeshGroup } from './ReflectionProbeVolumeMeshGroup'
import { ProbeVolumeMeshGroup } from './ProbeVolumeMeshGroup'

export class ProbeDebugger extends Group {
  protected probeVolumesGroups: ProbeVolumeMeshGroup[] = []

  protected probeVolumesProbesGroups: Group[] = []
  protected probeVolumesInfluenceGroups: Group[] = []

  protected _probesVisible = true
  protected _influenceVisible = true
  protected probeVolumes: AnyProbeVolume[] = [];

  constructor(probeVolumes: AnyProbeVolume[] = []) {
    super()

    this.addProbeVolumes(...probeVolumes);
  }

  get probesVisible() {
    return this._probesVisible
  }

  set probesVisible(value: boolean) {
    if (value !== this._probesVisible) {
      this._probesVisible = value
      for (const group of this.probeVolumesProbesGroups) {
        group.visible = value
      }
    }
  }

  get influenceVisible() {
    return this._influenceVisible
  }

  set influenceVisible(value: boolean) {
    if (value !== this._influenceVisible) {
      this._influenceVisible = value
      for (const group of this.probeVolumesInfluenceGroups) {
        group.visible = value
      }
    }
  }

  addProbeVolumes(...probeVolumes: AnyProbeVolume[]) {
    let group: ProbeVolumeMeshGroup<AnyProbeVolume> = null
    
    for (let volume of probeVolumes) {
      if (this.probeVolumes.indexOf(volume) === -1) {
        this.probeVolumes.push(volume)

        group = null

        if (volume instanceof IrradianceProbeVolume) {
          group = new IrradianceProbeVolumeMeshGroup(volume)
        } else if (volume instanceof ReflectionProbeVolume) {
          group = new ReflectionProbeVolumeMeshGroup(volume)
        } else {
          throw new Error('Invalid probe volume type')
        }

        if (group !== null) {
          this.probeVolumesGroups.push(group)
          this.probeVolumesProbesGroups.push(group.probesGroup)
          this.probeVolumesInfluenceGroups.push(group.influenceGroup)

          group.probesGroup.visible = this._probesVisible
          group.influenceGroup.visible = this._influenceVisible
          
          this.add(group)
        }
      }
    }
  }

  removeProbeVolumes(...probeVolumes: AnyProbeVolume[]) {
    for (let volume of probeVolumes) {
      const index = this.probeVolumes.indexOf(volume)

      if (index !== -1) {
        this.probeVolumes.splice(index, 1)

        const group = this.probeVolumesGroups[index]

        this.probeVolumesGroups.splice(index, 1)
        this.probeVolumesProbesGroups.splice(index, 1)
        this.probeVolumesInfluenceGroups.splice(index, 1)

        this.remove(group)
      }
    }
  }

}
