import { Scene, Texture } from 'three'
import { AnyProbeVolume } from './volume'
import { GlobalEnvVolume } from './volume/GlobalEnvVolume'

export class ProbesScene {
  constructor(
    readonly volumes: AnyProbeVolume[],
    readonly environment?: GlobalEnvVolume
  ) {}


}
