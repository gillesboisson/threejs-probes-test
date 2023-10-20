import { Scene, Texture } from 'three'
import { AnyProbeVolume } from './volume'

export class ProbesScene {
  constructor(
    readonly volumes: AnyProbeVolume[],
    readonly environment?: Texture
  ) {}


}
