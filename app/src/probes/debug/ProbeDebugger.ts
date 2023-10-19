import { Group } from 'three'
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume'
import { IrradianceProbeVolumeMeshGroup } from './IrradianceProbeVolumeMeshGroup'
import { ReflectionProbeVolumeMeshGroup } from './ReflectionProbeVolumeMeshGroup'
import { ProbeVolumeMeshGroup } from './ProbeVolumeMeshGroup'
import GUI from 'lil-gui'

export class ProbeDebugger extends Group {
  protected probeVolumesGroups: ProbeVolumeMeshGroup[] = []

  protected probeVolumesProbesGroups: Group[] = []
  // protected probeVolumesInfluenceGroups: Group[] = []

  protected _probesVisible = true
  protected _reflectionProbesVisible = true
  protected _irradianceProbesVisible = true

  protected _influenceVisible = true


  protected probeVolumes: AnyProbeVolume[] = []

  public visibilityChanged = (): void => {};

  constructor(probeVolumes: AnyProbeVolume[] = []) {
    super()

    this.addProbeVolumes(...probeVolumes)
  }

  get probesVisible() {
    return this._probesVisible
  }

  set probesVisible(value: boolean) {
    if (value !== this._probesVisible) {
      this._probesVisible = value
      this.refreshVisibility()
    }
  }

  get influenceVisible() {
    return this._influenceVisible
  }

  set influenceVisible(value: boolean) {
    if (value !== this._influenceVisible) {
      this._influenceVisible = value
      this.refreshVisibility()
    }
  }

  set reflectionProbesVisible(value: boolean) {
    if (value !== this._reflectionProbesVisible) {
      this._reflectionProbesVisible = value
      this.refreshVisibility()
    }
  }

  get reflectionProbesVisible() {
    return this._reflectionProbesVisible
  }

  set irradianceProbesVisible(value: boolean) {
    if (value !== this._irradianceProbesVisible) {
      this._irradianceProbesVisible = value
      this.refreshVisibility()
    }
  }

  get irradianceProbesVisible() {
    return this._irradianceProbesVisible
  }

  protected refreshVisibility() {
    // influence

    for (const group of this.probeVolumesGroups) {
      const visible =
        this._probesVisible &&
        ((group instanceof IrradianceProbeVolumeMeshGroup &&
          this._irradianceProbesVisible) ||
          (group instanceof ReflectionProbeVolumeMeshGroup &&
            this._reflectionProbesVisible))

      const influenceVisible = visible && this._influenceVisible
      group.influenceGroup.visible = influenceVisible

      group.visible = visible
    }

    this.visibilityChanged();
  }

  gui(gui: GUI) {
    const folder = gui.addFolder('Probe debugger')
    const mainVisibleProp = folder
      .add(this, 'probesVisible')
      .name('Display all Probes')

    const subProps = [
      folder
        .add(this, 'reflectionProbesVisible')
        .name('Display reflection probes only'),
      folder
        .add(this, 'irradianceProbesVisible')
        .name('Display irradiance probes only'),
      folder.add(this, 'influenceVisible').name('Display Influence'),
    ]
    // visible only if probes visible enabled
    mainVisibleProp.listen().onChange((value) => {
      for (let prop of subProps) {
        if (value) {
          prop.show()
        } else {
          prop.hide()
        }
      }
    })
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

          this.add(group)
        }
      }
    }

    this.refreshVisibility()
  }

  removeProbeVolumes(...probeVolumes: AnyProbeVolume[]) {
    for (let volume of probeVolumes) {
      const index = this.probeVolumes.indexOf(volume)

      if (index !== -1) {
        this.probeVolumes.splice(index, 1)

        const group = this.probeVolumesGroups[index]

        this.probeVolumesGroups.splice(index, 1)
        this.probeVolumesProbesGroups.splice(index, 1)
        // this.probeVolumesInfluenceGroups.splice(index, 1)

        this.remove(group)
      }
    }
  }
}
