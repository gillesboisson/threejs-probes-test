import { CubeTexture, Vector3 } from 'three'
import { GlobalEnvVolumeDefinition } from '../data'
import { GlobalEnvVolumeData } from '../data/GlobalEnvVolumeData'
import { Probe, RoughnessLodMapping } from '../Probe'
import { ReflectionProbeVolume } from './ReflectionProbeVolume'

export class GlobalEnvVolume {
  readonly data: Readonly<GlobalEnvVolumeData>

  position: Vector3

  readonly irradianceCubeProbe: Probe
  readonly reflectionCubeProbe: Probe

  reflectionRoughnessMapping: RoughnessLodMapping

  constructor(
    definition: GlobalEnvVolumeDefinition,
    {
      irradianceCubeTexture,
      reflectionCubeTexture,
    }: {
      irradianceCubeTexture: CubeTexture
      reflectionCubeTexture: CubeTexture
    }
  ) {
    this.data = definition.data

    this.reflectionRoughnessMapping = {
      nbLevels: definition.data.reflectance_nb_levels,
      startRoughness: definition.data.reflectance_start_roughness,
      endRoughness:
        definition.data.reflectance_start_roughness +
        definition.data.reflectance_nb_levels *
          definition.data.reflectance_level_roughness,
    }

    this.position = new Vector3(...definition.position)

    this.irradianceCubeProbe = {
      position: new Vector3(...definition.position),
      type: 'irradiance',
      texture: irradianceCubeTexture,
    }

    this.reflectionCubeProbe = {
      position: new Vector3(...definition.position),
      type: 'reflection',
      texture: reflectionCubeTexture,
    }
  }

  roughnessToTextureLod(roughness: number): number {
    return ReflectionProbeVolume.RoughnessToTextureLod(
      roughness,
      this.reflectionRoughnessMapping
    )
  }
}
