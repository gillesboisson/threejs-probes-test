import { CubeTexture } from 'three';
import { GlobalEnvVolumeDefinition } from '../data';
import { GlobalEnvVolumeData } from '../data/GlobalEnvVolumeData';


export class GlobalEnvVolume {
  readonly data: Readonly<GlobalEnvVolumeData>;

  readonly irradianceCubeTexture: CubeTexture;
  readonly reflectionCubeTexture: CubeTexture;

  constructor(
    defintion: GlobalEnvVolumeDefinition,
    {
      irradianceCubeTexture, reflectionCubeTexture,
    }: {
      irradianceCubeTexture: CubeTexture;
      reflectionCubeTexture: CubeTexture;
    }
  ) {
    this.data = defintion.data;
    this.irradianceCubeTexture = irradianceCubeTexture;
    this.reflectionCubeTexture = reflectionCubeTexture;
  }
}
