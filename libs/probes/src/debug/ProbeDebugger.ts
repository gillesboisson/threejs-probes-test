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
import { GlobalEnvVolume } from '../volume/GlobalEnvVolume'
import { GlobalEnvMesh } from './GlobalEnvMesh'
import { ProbeVolumeHandler } from '../handlers/ProbeVolumeHandler'

export class ProbeDebugger extends Group {
  protected probeVolumesGroups: ProbeVolumeMeshGroup[] = []
  protected probeVolumesProbesGroups: Group[] = []

  protected _probesVisible = false
  protected _reflectionProbesVisible = true
  protected _irradianceProbesVisible = true

  protected _influenceVisible = false

  // protected probeVolumes: AnyProbeVolume[] = []

  protected _globalEnvVolume: GlobalEnvVolume | null

  protected globalEnvMesh: GlobalEnvMesh | null = null

  public visibilityChanged = (): void => {}

  constructor(readonly probeScene: ProbeVolumeHandler) {
    super()

    for (let volume of probeScene.irradianceVolumes.volumes) {
      const group = new IrradianceProbeVolumeMeshGroup(volume)
      this.probeVolumesGroups.push(group)
      this.probeVolumesProbesGroups.push(group.probesGroup)
      this.add(group)
    }

    for (let volume of probeScene.reflectionVolumes.volumes) {
      const group = new ReflectionProbeVolumeMeshGroup(volume)
      this.probeVolumesGroups.push(group)
      this.probeVolumesProbesGroups.push(group.probesGroup)
      this.add(group)
    }

    if (probeScene.globalEnv) {
      this._globalEnvVolume = probeScene.globalEnv
      this.globalEnvMesh = new GlobalEnvMesh(probeScene.globalEnv)
      this.add(this.globalEnvMesh)
    }

    this.refreshVisibility();
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

    if (this.globalEnvMesh !== null) {
      this.globalEnvMesh.reflectionMesh.visible =
        this._probesVisible && this._reflectionProbesVisible
      this.globalEnvMesh.irradianceMesh.visible =
        this._probesVisible && this._irradianceProbesVisible
    }

    this.visibilityChanged()
  }

  gui(gui: GUI, folder = gui.addFolder('Probes')) {
    const mainVisibleProp = folder
      .add(this, 'probesVisible')
      .name('Display all Probes')

    const subProps = [
      folder
        .add(this, 'reflectionProbesVisible')
        .name('Display reflection probes'),
      folder
        .add(this, 'irradianceProbesVisible')
        .name('Display irradiance probes'),
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

}
