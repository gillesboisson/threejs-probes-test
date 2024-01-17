import {
  CubeTexture,
  DataTexture,
  DataTextureLoader,
  DefaultLoadingManager,
  Light,
  LoadingManager,
  Object3D,
  PMREMGenerator,
  Renderer,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { ProbeVolumeHandler } from '../handlers/ProbeVolumeHandler';
import {
  AnyProbeVolumeJSON,
  BakingJSON,
  GlobalEnvProbeVolumeJSON,
  IrradianceProbeVolumeJSON,
  LightMapJSON,
  ReflectionProbeVolumeJSON,
  VisibilityDefinition,
  groupLightMap,
} from '../data';
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume';
import { generateProbeGridCubemaps } from './generateProbeGridCubemaps';
import { generateReflectionProbeCubemap } from './generateReflectionProbeCubemap';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { CubemapWrapper } from './CubemapsWrapper';
import { Probe } from '../Probe';
import { GlobalEnvVolume } from '../volume/GlobalEnvVolume';
import { cleanObjectName } from '../helpers';
import { LightmapHandler } from '../handlers/LightmapHandler';
import { VisibilityHandler } from '../handlers/VisibilityHandler';

export type BakeLoaderResult = {
  probeVolumeHandler: ProbeVolumeHandler;
  lightmapHandler: LightmapHandler;
  visibilityHandler: VisibilityHandler;
  // visibilityCollection: VisibilityDefinition[];
};

export class BakeLoader {
  protected _probeVolumeHandler: ProbeVolumeHandler = null;

  dir: string = './';
  protected cubemapWrapper: CubemapWrapper;
  protected _lightmapHandler: LightmapHandler;
  // protected _staticObjectNames: string[] = [];

  constructor(
    readonly renderer: WebGLRenderer,
    readonly loadManager: LoadingManager = DefaultLoadingManager
  ) {
    this.cubemapWrapper = new CubemapWrapper(renderer);
  }

  protected getVisibilityDefinition(
    collectionName: string,
    collection: VisibilityDefinition[],
    failIfNotFound = true
  ) {
    const definition = collection.find(
      (collection) => collection.name === collectionName
    );

    if (!definition && failIfNotFound) {
      throw new Error(`No collection with name ${collectionName}`);
    }

    return definition;
  }

  /**
   *
   * Update object and lights layers property to match with backed lights
   * backed light will be enabled in all layers by default and removed from layers matching with visibility collection index
   * other objects will be disabled in all layers by default and enabled in layers matching with visibility collection index
   * @param objects
   * @param visibilityCollection
   * @param disableStaticObjectMatrixAutoUpdate : as backed objects are static, we can disable matrix auto update (default : true)
   * @param throwErrorIfObjectMissing  : throw an error if an object defined in the visibility collection is not found in objects (default : true)
   *
   */
  // setupSceneLayerVisibility(
  //   objects: Object3D[],
  //   visibilityCollection: VisibilityDefinition[],
  //   disableStaticObjectMatrixAutoUpdate = true,
  //   throwErrorIfObjectMissing = true
  // ) {
  //   const foundObjects = [];

  //   for (
  //     let indexLayer = 0;
  //     indexLayer < visibilityCollection.length;
  //     indexLayer++
  //   ) {
  //     const layer = visibilityCollection[indexLayer];

  //     for (let objectName of layer.objects) {
  //       const object = objects.find((object) => object.name === objectName);
  //       if (!object && throwErrorIfObjectMissing) {
  //         throw new Error(`Object with name ${objectName} not found`);
  //       }

  //       if (foundObjects.includes(object)) {
  //         foundObjects.push(object);
  //         // if object is light we remove it from all layers
  //         if (object instanceof Light) {
  //           object.layers.enableAll();
  //         } else {
  //           object.layers.disableAll();
  //         }
  //         if (disableStaticObjectMatrixAutoUpdate) {
  //           object.matrixAutoUpdate = false;
  //           object.updateMatrixWorld(true);
  //         }
  //       }
  //       if (object instanceof Light) {
  //         object.layers.disable(indexLayer);
  //       } else {
  //         object.layers.enable(indexLayer);
  //       }
  //     }
  //   }
  // }

  async load(url: string): Promise<BakeLoaderResult> {
    const data = await this.loadJSON(url);

    data.visibility_collections.forEach((collection) => {
      collection.objects = collection.objects.map((objectName) =>
        cleanObjectName(objectName)
      );
    });

    this._probeVolumeHandler = null;
    this._probeVolumeHandler = await this.setProbesData(
      data.probes,
      data.visibility_collections
    );

    this._lightmapHandler = null;
    this._lightmapHandler = await this.setLightmapData(
      data.baked_maps,
      data.visibility_collections
    );

    return {
      probeVolumeHandler: this._probeVolumeHandler,
      lightmapHandler: this._lightmapHandler,
      visibilityHandler: new VisibilityHandler(data.visibility_collections),
      // visibilityCollection: data.visibility_collections,
    };
  }

  async setLightmapData(
    lightmaps: LightMapJSON[],
    visibility: VisibilityDefinition[]
  ): Promise<LightmapHandler> {
    // group lightmaps by name with sub prop object_names

    const lightMapGroups = groupLightMap(lightmaps, visibility);

    const textureUrls = lightMapGroups.map(
      (lightMap) => this.dir + lightMap.filename
    );
    const textures = await this.loadTextures(textureUrls, true);

    return new LightmapHandler(lightMapGroups, visibility, textures);
  }

  async setProbesData(
    probes: AnyProbeVolumeJSON[],
    visibility: VisibilityDefinition[]
  ): Promise<ProbeVolumeHandler> {
    // Load probes

    const probesJSON = probes.filter(
      (probe) => probe.probe_type !== 'global'
    ) as AnyProbeVolumeJSON[];

    const sourceTextures = await this.loadTextures(
      probesJSON.map((probe) => {
        console.log((probe as IrradianceProbeVolumeJSON).file);
        switch (probe.probe_type) {
          case 'irradiance':
            return this.dir + (probe as IrradianceProbeVolumeJSON).file;
          case 'reflection':
            return this.dir + (probe as ReflectionProbeVolumeJSON).file;
        }
      })
    );

    const volumes: AnyProbeVolume[] = [];
    const gen = new PMREMGenerator(this.renderer);

    const cubemapWrapper = new CubemapWrapper(this.renderer);

    for (let i = 0; i < probesJSON.length; i++) {
      const sourceTexture = sourceTextures[i];
      const json = probesJSON[i];

      switch (json.probe_type) {
        case 'irradiance':
          const nbCubes =
            json.data.resolution[0] *
            json.data.resolution[1] *
            json.data.resolution[2];

          const irradianceLayouts = CubemapWrapper.gridLayout(
            sourceTexture.image.width,
            sourceTexture.image.height,
            json.baking.cubemap_face_size,
            nbCubes
          );

          // const textures: CubeTexture[] = []
          const textures: CubeTexture[] =
            cubemapWrapper.wrapCubeCollectionFromTexture(
              sourceTexture,
              json.baking.cubemap_face_size,
              irradianceLayouts
            );

          volumes.push(
            new IrradianceProbeVolume({
              ...json,
              textures,
            })
          );

          break;

        case 'reflection':
          const reflectionLayouts = CubemapWrapper.lodLayout(
            json.baking.cubemap_face_size,
            json.baking.nb_levels
          );

          const texture = cubemapWrapper.wrapCubeLodFromTexture(
            sourceTexture,
            json.baking.cubemap_face_size,
            reflectionLayouts
          );

          // const texture = generateReflectionProbeCubemap(json, image)
          const volume = new ReflectionProbeVolume({
            ...json,
            textures: [texture],
          });
          volumes.push(volume);
          break;

        default:
          throw new Error('unknown probe type');

          break;
      }
    }

    gen.dispose();

    let globalEnv: GlobalEnvVolume;

    const envsJSON = probes.filter(
      (probe) => probe.probe_type === 'global'
    ) as GlobalEnvProbeVolumeJSON[];

    if (envsJSON.length > 1) {
      throw new Error('Only one global environment is supported');
    }

    if (envsJSON.length === 0) {
      console.warn('No global environment found');
    } else {
      const envJSON = envsJSON[0];
      const { data, irradiance_file, reflection_file, baking } = envJSON;
      const textureFiles = [
        this.dir + irradiance_file,
        this.dir + reflection_file,
      ];
      const textures = await this.loadTextures(textureFiles);
      const irradianceSourceTexture = textures[0];

      const irradianceLayouts = CubemapWrapper.gridLayout(
        irradianceSourceTexture.image.width,
        irradianceSourceTexture.image.height,
        baking.irradiance.cubemap_face_size
      );

      const irradianceCubeTexture =
        cubemapWrapper.wrapCubeCollectionFromTexture(
          irradianceSourceTexture,
          baking.irradiance.cubemap_face_size,
          irradianceLayouts
        )[0];

      const reflectionSourceTexture = textures[1];

      const reflectionLayouts = CubemapWrapper.lodLayout(
        baking.reflection.cubemap_face_size,
        baking.reflection.nb_levels
      );

      const reflectionCubeTexture = cubemapWrapper.wrapCubeLodFromTexture(
        reflectionSourceTexture,
        baking.reflection.cubemap_face_size,
        reflectionLayouts
      );

      globalEnv = new GlobalEnvVolume(envJSON, {
        irradianceCubeTexture,
        reflectionCubeTexture,
      });
    }

    return new ProbeVolumeHandler(volumes, visibility, globalEnv);
  }

  loadJSON(url: string): Promise<BakingJSON> {
    this.dir = url.replace(/[^/]+$/, '');
    return fetch(url).then((res) => res.json() as Promise<BakingJSON>);
  }

  loadTextures(urls: string[], autoFlipLightmaps = false): Promise<Array<Texture>> {
    // const urls = probes.map((probe) => this.dir + probe.file)
    return new Promise((resolve, err) => {
      let indexLoading = 0;
      let indexLoaded = 0;
      const images: Array<Texture> = [];

      const rgbeLoader = new RGBELoader(this.loadManager);
      const exrLoader = new EXRLoader(this.loadManager);

      const loadNext = () => {
        indexLoaded++;
        if (indexLoaded === urls.length) {
          resolve(images);
        } else {
          loadImage();
        }
      };

      const loadImage = () => {
        const url = urls[indexLoading++];

        const extension = url.split('.').pop().toLowerCase();

        switch (extension.toLowerCase()) {
          case 'exr':
            exrLoader.load(
              url,
              (image) => {
                if(autoFlipLightmaps){
                  image.flipY = true;
                }
                images.push(image);
                loadNext();
              },
              undefined,
              (e) => {
                err(e);
              }
            );
            return;
          case 'hdr':
            rgbeLoader.load(
              url,
              (image) => {
                if(autoFlipLightmaps){
                  image.flipY = true;
                }
                images.push(image);
                loadNext();
              },
              undefined,
              (e) => {
                err(e);
              }
            );
            return;
          default:
            const textureLoader = new TextureLoader();
            textureLoader.load(
              url,
              (image) => {
                if(autoFlipLightmaps){
                  image.flipY = false;
                }
                images.push(image);
                loadNext();
              },
              undefined,
              (e) => {
                err(e);
              }
            );
            return;
        }
      };

      loadImage();
    });
  }
}
