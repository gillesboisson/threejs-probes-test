import { CubeTexture, Vector3 } from 'three';
import { GlobalEnvProbeVolumeData, GlobalEnvProbeVolumeDefinition } from '../data';
import { Probe, RoughnessLodMapping } from '../type';
import { ReflectionProbeVolume } from './ReflectionProbeVolume';

export class GlobalEnvVolume {
  readonly data: Readonly<GlobalEnvProbeVolumeData>;

  position: Vector3;

  readonly irradianceCubeProbe: Probe;
  readonly reflectionCubeProbe: Probe;

  reflectionRoughnessMapping: RoughnessLodMapping;

  constructor(
    { baking, data, transform }: GlobalEnvProbeVolumeDefinition,
    {
      irradianceCubeTexture,
      reflectionCubeTexture,
    }: {
      irradianceCubeTexture: CubeTexture;
      reflectionCubeTexture: CubeTexture;
    }
  ) {
    this.data = data;

    this.reflectionRoughnessMapping = {
      nbLevels: baking.reflection.nb_levels,
      startRoughness: baking.reflection.start_roughness,
      endRoughness: baking.reflection.end_roughness,
    };

    this.position = new Vector3(...transform.position);

    this.irradianceCubeProbe = {
      position: new Vector3(...transform.position),
      type: 'irradiance',
      texture: irradianceCubeTexture,
    };

    this.reflectionCubeProbe = {
      position: new Vector3(...transform.position),
      type: 'reflection',
      texture: reflectionCubeTexture,
    };
  }

  // roughnessToTextureLod(roughness: number): number {
  //   return ReflectionProbeVolume.RoughnessToTextureLod(
  //     roughness,
  //     this.reflectionRoughnessMapping
  //   );
  // }
}
