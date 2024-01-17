import {
  ACESFilmicToneMapping,
  AddOperation,
  AmbientLight,
  BufferGeometry,
  Camera,
  CineonToneMapping,
  Clock,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CustomToneMapping,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Light,
  LinearToneMapping,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MixOperation,
  MultiplyOperation,
  NoToneMapping,
  NormalBlending,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  ReinhardToneMapping,
  Scene,
  SphereGeometry,
  SpotLight,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';

import { MapControls } from 'three/examples/jsm/controls/MapControls';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  BakeLoader,
  ProbeDebugger,
  DynamicProbeDebugger,
  ProbeVolumeHandler,
  MeshProbeLambertMaterial,
  MeshProbePhongMaterial,
  MeshProbePhysicalMaterial,
  MeshProbeStandardMaterial,
  GlobalEnvProbeVolumeJSON,
  BakingJSON,
  LightmapHandler,
  BakeRenderLayer,
} from '@libs/probes';
import GUI from 'lil-gui';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { VisibilityHandler } from '@libs/probes/build/handlers/VisibilityHandler';

const guiParams = {
  exposure: 2.0,
  toneMapping: 'ACESFilmic',
  blurriness: 0.3,
  intensity: 1.0,
};

const toneMappingOptions = {
  None: NoToneMapping,
  Linear: LinearToneMapping,
  Reinhard: ReinhardToneMapping,
  Cineon: CineonToneMapping,
  ACESFilmic: ACESFilmicToneMapping,
  Custom: CustomToneMapping,
};

type AppDebugMaterials = {
  phong: MeshProbePhongMaterial;
  standard: MeshProbeStandardMaterial;
  lambert: MeshProbeLambertMaterial;
  physical: MeshProbePhysicalMaterial;
};

type BakedMaterialData = {
  name: string;
  lightMap: Texture;
  objectNames: string[];
};

export class App {
  protected clock = new Clock();
  protected scene = new Scene();
  protected renderer = new WebGLRenderer();
  protected materials: AppDebugMaterials;

  protected camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  protected controls: MapControls;
  private _refreshClosure = () => this.refresh();

  protected probesDebug: ProbeDebugger;
  protected dynamicProbeDebug: DynamicProbeDebugger;
  protected probeVolumeHandler: ProbeVolumeHandler;
  protected probeDebugMesh: Mesh;
  protected staticObjectsGroup: Group;
  protected probedObjectsGroup: Group;
  // protected currentDebugMaterialKey: keyof AppDebugMaterials = 'standard';

  // protected roofMeshName = 'Room-roof';
  // protected wallsMeshName = 'Room-walls';
  // protected sunPlaceholderName = 'Sun_Placeholder';

  protected roofMesh?: Mesh;
  protected wallsMesh?: Mesh;
  sunLight: DirectionalLight;
  private _requestRender: boolean = true;
  // private _staticObjectsNames: string[];
  protected lightmapHandler: LightmapHandler;
  private _bakeLoader: BakeLoader;
  protected visibilityHandler: VisibilityHandler;

  // get currentDebugMaterial() {
  //   return this.materials[this.currentDebugMaterialKey];
  // }

  async init() {
    const loadingCaption = document.getElementById('loading_caption');
    const loading = document.getElementById('loading');

    await this.setupRenderer();
    loadingCaption.innerHTML = 'probes';
    await this.loadBaking();
    loadingCaption.innerHTML = 'scene';
    await this.loadScene();
    loadingCaption.innerHTML = 'setup';
    this.setupCamera();
    this.initDebug();
    this.start();

    const requestRender = () => (this._requestRender = true);

    document.body.addEventListener('mousedown', requestRender);
    document.body.addEventListener('mousemove', requestRender);

    loading.remove();
  }

  protected async setupRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    // this.renderer.autoClearDepth = false;
    this.renderer.autoClear = false;

    const infoPanel = document.createElement('div');
    infoPanel.id = 'info-panel';
    document.body.appendChild(infoPanel);

    infoPanel.innerHTML = `Drag with right click to move the camera. <br> Draw with left rotate camera.`;
  }

  protected _bakedMaterialMap: BakedMaterialData[];

  async loadLightMaps(data: BakingJSON) {
    this._bakedMaterialMap = [];

    const promises = [];

    data.baked_maps.forEach((bakedMap) => {
      let materialMap = this._bakedMaterialMap.find(
        (m) => m.name === bakedMap.name
      ) as Partial<BakedMaterialData>;

      const objectName = bakedMap.object_name.split('.').join('');

      if (!materialMap) {
        materialMap = {
          name: bakedMap.name,
          objectNames: [objectName],
        };

        promises.push(
          new Promise((resolve) => {
            const isEXR = bakedMap.filename.endsWith('.exr');

            const loader = isEXR ? new EXRLoader() : new TextureLoader();

            const texture = loader.load(
              `baked-small-night/${bakedMap.filename}`,
              (t) => {
                t.flipY = true;
                t.channel = bakedMap.uv_index;

                resolve(t);
              }
            );


            // texture.flipY = true;

            // texture.needsUpdate = true;
            materialMap.lightMap = texture;
          })
        );

        this._bakedMaterialMap.push(materialMap as BakedMaterialData);
      } else {
        materialMap.objectNames.push(objectName);
      }
    });


    await Promise.all(promises);
  }

  async loadBaking() {
    this._bakeLoader = new BakeLoader(this.renderer);

    // const data = await probeLoader.loadJSON('baked-small-night/probes.json');

    const handlers = await this._bakeLoader.load(
      'baked-small-night/probes.json'
    );
    this.probeVolumeHandler = handlers.probeVolumeHandler;
    this.lightmapHandler = handlers.lightmapHandler;
    this.visibilityHandler = handlers.visibilityHandler;

    this.lightmapHandler.lightMapIntensity = 2;
  }

  async loadScene() {
    const loader = new GLTFLoader();

    this.staticObjectsGroup = new Group();
    this.probedObjectsGroup = new Group();
    this.scene.add(this.staticObjectsGroup, this.probedObjectsGroup);

    const gltf = await loader.loadAsync(
      'models/sponza-small/sponza-night.gltf'
    );

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const object = gltf.scene.children[i];
      let addToScene = false;
      let isStatic = false;
      // const isStatic = this._staticObjectsNames.includes(mesh.name);

      if (object.name === 'sun_placeholder') {
        this.sunLight = new DirectionalLight(0xffffff, 1);
        this.sunLight.lookAt(new Vector3(-1, 0, -0.1));
        this.sunLight.shadow.camera.left *= 5;
        this.sunLight.shadow.camera.right *= 5;
        this.sunLight.shadow.camera.top *= 5;
        this.sunLight.shadow.camera.bottom *= 5;
        this.sunLight.shadow.camera.far *= 5;

        this.scene.add(this.sunLight);

        this.sunLight.castShadow = true;

        this.sunLight.position.copy(object.position);
        this.sunLight.rotation.copy(object.rotation);
        this.sunLight.matrixWorldNeedsUpdate;

        continue;
      }

      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }

      if (object instanceof Mesh && this.lightmapHandler.setupObject(object)) {

        addToScene = true;
        isStatic = true;
      } else if (
        object instanceof Mesh &&
        this.probeVolumeHandler.setupObject(object)
      ) {

        addToScene = true;
        isStatic = false;
      } else {

        this.visibilityHandler.setupObject(object, true);
        addToScene = true;
        isStatic = false;
      }

      if (object instanceof Light) {
        object.intensity = 0.3;
        // lights.push(object);
      }

      if (addToScene) {
        i--;

        if (isStatic) {
          this.staticObjectsGroup.add(object);
        } else {
          this.probedObjectsGroup.add(object);
        }
      }
    }
  }

  protected setupCamera() {
    this.scene.add(this.camera);

    const targetPos = new Vector3(0, 1, 0);

    this.camera.position.copy(targetPos).add(new Vector3(0, 3, 3));

    this.camera.lookAt(targetPos);

    this.camera.layers.disableAll();
    this.camera.layers.enable(BakeRenderLayer.Static);
    this.camera.layers.enable(BakeRenderLayer.Active);
    // this.camera.layers.enable(BakeRenderLayer.StaticLights);

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(targetPos);
    this.controls.update();
  }

  protected initDebug() {
    const gui = new GUI();
    
    gui.title('Three JS Probes Volume');

    this.renderer.toneMapping = toneMappingOptions[guiParams.toneMapping];
    this.renderer.toneMappingExposure = guiParams.exposure;



    const toneMappingFolder = gui.addFolder('Tone Mapping');
    toneMappingFolder
      .add(guiParams, 'toneMapping', Object.keys(toneMappingOptions))
      .name('Tone mapping')
      .onChange((value) => {
        this.renderer.toneMapping = toneMappingOptions[value];
      });

    toneMappingFolder.add(guiParams, 'exposure', 0, 10).name('Exposure').onChange((value) => {
      this.renderer.toneMappingExposure = value;
    });

    this.probesDebug = new ProbeDebugger(this.probeVolumeHandler);
    this.probesDebug.visibilityChanged = () => (this._requestRender = true);
    this.probesDebug.gui(gui);
    this.scene.add(this.probesDebug);

    if (this.sunLight) {
      const lightFolder = gui.addFolder('Sun');

      lightFolder.add(this.sunLight, 'intensity', 0, 3);
      lightFolder.add(this.sunLight, 'castShadow').name("Cast shadow");
      lightFolder.add(this.sunLight.shadow, 'radius', 0, 10);
      lightFolder.add(this.sunLight.shadow, 'bias', -1, 1);
      // lightFolder.add(this.sunLight.shadow.camera, 'near', 0, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'far', 0, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'left', -100, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'right', -100, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'top', -100, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'bottom', -100, 100)
    }

    const lightmapFolder = gui.addFolder('Lightmap');

    lightmapFolder.add(this.lightmapHandler, 'lightMapIntensity', 0.5, 3).name('Lightmap intensity');
    lightmapFolder.add(this.lightmapHandler, 'displayMap').name('Display albedo map');
    lightmapFolder.add(this.lightmapHandler, 'displayLightmap').name('Display lightmap');

  }

  start() {
    this.clock.start();
    this.refresh(0);
    window.requestAnimationFrame(this._refreshClosure);
  }

  stop() {
    this.clock.stop();
  }

  refresh(forcedDeltaTime: number = -1) {
    if (this.clock.running) {
      const clockDeltaTime = this.clock.getElapsedTime();
      const deltaTime =
        forcedDeltaTime !== -1 ? forcedDeltaTime : clockDeltaTime;
      const frameRatio = (deltaTime * 1) / 60;

      this.update(deltaTime, frameRatio);
      this.render(deltaTime, frameRatio);

      window.requestAnimationFrame(this._refreshClosure);
    }
  }

  update(deltaTime: number, frameRatio: number) {
    if (this.controls) {
      this.updateProbeDebug();
    }
  }

  updateProbeDebug() {}

  render(deltaTime: number, frameRatio: number) {
   
    const layers = [0, BakeRenderLayer.Static, BakeRenderLayer.Active];
    if (this._requestRender === true) {
      this.renderer.clear();

      for (let l of layers) {
        this.camera.layers.disableAll();
        this.camera.layers.set(l);

        this.renderer.render(this.scene, this.camera);
      }
      this._requestRender = false;
    }
  }
}
