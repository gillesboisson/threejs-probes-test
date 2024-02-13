import {
  AmbientLight,
  CubeTexture,
  DefaultLoadingManager,
  DirectionalLight,
  Group,
  Light,
  LightShadow,
  LoadingManager,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PMREMGenerator,
  PointLight,
  Scene,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { ProbeVolumeHandler } from '../handlers/ProbeVolumeHandler';
import {
  AnyProbeVolumeJSON,
  BakeRenderLayer,
  BakingJSON,
  GlobalEnvProbeVolumeJSON,
  IrradianceProbeVolumeJSON,
  LightMapDefinition,
  LightMapGroupDefinition,
  LightMapGroupJSON,
  ReflectionProbeVolumeJSON,
  VisibilityDefinition,
} from '../data';
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { CubemapWrapper } from './CubemapsWrapper';
import { GlobalEnvVolume } from '../volume/GlobalEnvVolume';
import { cleanObjectName } from '../helpers';
import { LightmapHandler } from '../handlers/LightmapHandler';
import { VisibilityHandler } from '../handlers/VisibilityHandler';

export type BakeLoaderResult = {
  probeVolumeHandler: ProbeVolumeHandler;
  lightmapHandler: LightmapHandler;
  // visibilityHandler: VisibilityHandler;
  // visibilityCollection: VisibilityDefinition[];
};

export type BakeLoaderSceneResult = BakeLoaderResult & {
  scene: Scene;
  groups: Group[];
  objects: Object3D[];
};

import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProbeMeshMaterial } from '../debug';
import { IProbeMaterial } from '../type';
import {
  BakeSceneMapperMapMaterial,
  BakeSceneMapperMapObject,
} from '../handlers';
import { AnyMeshProbeMaterial, ConvertibleMeshProbeMaterial } from '../materials';
import { VisibilityLayersHandler } from './VisibilityLayersHandler';

export class BakeLoader {
  dir: string = './';

  protected _probeVolumeHandler: ProbeVolumeHandler = null;
  protected _cubemapWrapper: CubemapWrapper;
  protected _lightmapHandler: LightmapHandler;

  constructor(
    readonly renderer: WebGLRenderer,
    readonly loadManager: LoadingManager = DefaultLoadingManager
  ) {
    this._cubemapWrapper = new CubemapWrapper(renderer);
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

  mapObject: BakeSceneMapperMapObject | null = null;

  mapProbeMaterial: BakeSceneMapperMapMaterial<
  ConvertibleMeshProbeMaterial,
    AnyMeshProbeMaterial
  > | null = null;

  filterProbeMesh: (mesh: Mesh, handler: ProbeVolumeHandler) => boolean = null;

  async loadScene(
    url: string,
    scene: Scene = new Scene()
  ): Promise<BakeLoaderSceneResult> {
    this.dir = url.replace(/[^/]+$/, '');
    
    const gltf: GLTF = await new GLTFLoader(this.loadManager).loadAsync(url);
    const probeJSON = gltf.scene.userData.bake_gi_export_json as BakingJSON;
    const handers = await this.setupHandlers(probeJSON);

    

    const collections = probeJSON.collections;

    const layerHandler = new VisibilityLayersHandler();

    layerHandler.setupObjectLayers(collections, gltf.scene.children);
    
    

    const objects: Object3D[] = [];

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const sceneObject = gltf.scene.children[i];

      let object =
        sceneObject instanceof Mesh && this.mapObject !== null
          ? this.mapObject(sceneObject, sceneObject.material, this)
          : gltf.scene.children[i];

      let addToScene = false;

      

      if (object.layers.mask === 0) {
        continue;
      }

      if (object instanceof Light) {
        addToScene = true;
        object.intensity /= 10000;
      }

      if (object instanceof Mesh) {
        addToScene = true;
        if(object.name === 'red_cube001') debugger
        this._lightmapHandler.addMesh(object);        
        this._probeVolumeHandler.addMesh(object)
      }

      if (addToScene) {
        objects.push(object);
      }
    }

    const groups = layerHandler.setupObjectLayersGroup(objects, collections);
    scene.add(...groups);

    return {
      ...handers,
      scene,
      groups,
      objects,
    };
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

  async setupHandlers(data: BakingJSON): Promise<BakeLoaderResult> {
    // data.collections.forEach((collection) => {
    //   collection.objects = collection.objects.map((objectName) =>
    //     cleanObjectName(objectName)
    //   );
    // });

    this._probeVolumeHandler = null;
    this._probeVolumeHandler = await this.setProbesData(
      data.probes,
      data.collections
    );

    this._probeVolumeHandler.mapMaterial = this.mapProbeMaterial;
    this._probeVolumeHandler.filterMesh = this.filterProbeMesh;

    this._lightmapHandler = null;
    this._lightmapHandler = await this.setLightmapData(
      data.baked_maps,
      data.collections
    );

    if (this._probeVolumeHandler.globalEnv) {
      this._lightmapHandler.defaultEnvTexture =
        this._probeVolumeHandler.globalEnv.reflectionCubeProbe.texture;
    }

    // this._visibilityHandler = new VisibilityHandler(
    //   data.collections
    // );

    return {
      probeVolumeHandler: this._probeVolumeHandler,
      lightmapHandler: this._lightmapHandler,
      // visibilityHandler: this._visibilityHandler,
      // visibilityCollection: data.visibility_collections,
    };
  }

  async loadData(url: string): Promise<BakeLoaderResult> {
    const data = await this.loadJSON(url);
    return this.setupHandlers(data);
  }

  async setLightmapData(
    lightmapGroupsJSON: LightMapGroupJSON[],
    visibilities: VisibilityDefinition[]
  ): Promise<LightmapHandler> {
    // group lightmaps by name with sub prop object_names

    const maps = lightmapGroupsJSON.map((group) => group.maps).flat();

    const textureUrls = maps.map((map) => this.dir + map.filename);

    const textures = await this.loadTextures(textureUrls, true);

    const lightmapGroups: LightMapGroupDefinition[] = lightmapGroupsJSON.map(
      (group) => {
        const visibilityDefinition = group.visibility.collection ? this.getVisibilityDefinition(
          group.visibility.collection,
          visibilities
        ) : null;

        const groupMaps: LightMapDefinition[] = group.maps.map((lightMap) => {
          const mapIndex = maps.findIndex(
            (m) => m.filename === lightMap.filename
          );
          if (mapIndex === -1) {
            throw new Error(`Could not find map ${lightMap.filename}`);
          }

          const texture = textures[mapIndex];

          return {
            ...lightMap,
            objects: lightMap.objects.map(cleanObjectName),
            map: texture,
          };
        });

        return {
          ...group,
          maps: groupMaps,
          visibility: visibilityDefinition,
        };
      }
    );

    return new LightmapHandler(lightmapGroups, visibilities);
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

  loadTextures(
    urls: string[],
    autoFlipLightmaps = false
  ): Promise<Array<Texture>> {
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
                if (autoFlipLightmaps) {
                  image.flipY = true;

                  // image.flipX = true;

                  // image.flipY = true;
                }
                images.push(image);
                image.name = url.split('/').pop();
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
                if (autoFlipLightmaps) {
                  // image.flipY != image.flipY
                  // image.flipY = true;
                }
                images.push(image);
                image.name = url.split('/').pop();

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
                if (autoFlipLightmaps) {
                  image.flipY = false;
                }
                images.push(image);
                image.name = url.split('/').pop();

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
