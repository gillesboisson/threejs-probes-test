import { Scene, Texture, Vector3 } from 'three'
import {
  AnyProbeVolume,
  IrradianceProbeVolumeGroup,
  ReflectionProbeVolumeGroup,
  GlobalEnvVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from './volume'
import { ProbeRatio, ProbeRatioLod } from './type'

export class ProbeVolumeHandler {
  private _irradianceProbeRatio: ProbeRatio[] = []
  private _reflectionProbeRatio: ProbeRatioLod[] = []

  readonly irradianceVolumes = new IrradianceProbeVolumeGroup()
  readonly reflectionVolumes = new ReflectionProbeVolumeGroup()

  constructor(
    volumes: AnyProbeVolume[],
    protected _globalEnv: GlobalEnvVolume | null = null
  ) {
    this.addVolume(...volumes)

    if (_globalEnv) {
      this.reflectionVolumes.fallbackVolume = _globalEnv
      this.irradianceVolumes.fallbackVolume = _globalEnv
    }
  }

  get globalEnv() {
    return this._globalEnv
  }

  set globalEnv(value: GlobalEnvVolume | null) {
    if (value !== this._globalEnv) {
      this._globalEnv = value
      this.reflectionVolumes.fallbackVolume = value
      this.irradianceVolumes.fallbackVolume = value
    }
  }

  addVolume(...volumes: AnyProbeVolume[]) {
    volumes
      .filter((v) => v instanceof IrradianceProbeVolume)
      .forEach((v) => {
        this.irradianceVolumes.addVolume(v as IrradianceProbeVolume)
      })

    volumes
      .filter((v) => v instanceof ReflectionProbeVolume)
      .forEach((v) => {
        this.reflectionVolumes.addVolume(v as ReflectionProbeVolume)
      })
  }

  removeVolume(...volumes: AnyProbeVolume[]) {
    volumes
      .filter((v) => v instanceof IrradianceProbeVolume)
      .forEach((v) => {
        this.irradianceVolumes.removeVolume(v as IrradianceProbeVolume)
      })

    volumes
      .filter((v) => v instanceof ReflectionProbeVolume)
      .forEach((v) => {
        this.reflectionVolumes.removeVolume(v as ReflectionProbeVolume)
      })
  }
}
