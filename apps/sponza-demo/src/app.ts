import {
  ACESFilmicToneMapping,
  AddOperation,
  AmbientLight,
  CineonToneMapping,
  Clock,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CustomToneMapping,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  LinearToneMapping,
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
  ProbeLoader,
  ProbeDebugger,
  DynamicProbeDebugger,
  ProbeVolumeHandler,
  MeshProbeLambertMaterial,
  MeshProbePhongMaterial,
  MeshProbePhysicalMaterial,
  MeshProbeStandardMaterial,
  GlobalEnvProbeVolumeJSON,
  BakingJSON,
} from '@libs/probes';
import GUI from 'lil-gui';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';

const guiParams = {
  exposure: 1.0,
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
  protected probeHandler: ProbeVolumeHandler;
  protected probeDebugMesh: Mesh;
  protected staticObjectsGroup: Group;
  protected probedObjectsGroup: Group;
  protected currentDebugMaterialKey: keyof AppDebugMaterials = 'standard';

  protected roofMeshName = 'Room-roof';
  protected wallsMeshName = 'Room-walls';
  protected sunPlaceholderName = 'Sun_Placeholder';

  protected roofMesh?: Mesh;
  protected wallsMesh?: Mesh;
  sunLight: DirectionalLight;
  private _requestRender: boolean = true;
  private _staticObjectsNames: string[];

  get currentDebugMaterial() {
    return this.materials[this.currentDebugMaterialKey];
  }

  async init() {
    const loadingCaption = document.getElementById('loading_caption');
    const loading = document.getElementById('loading');

    await this.setupRenderer();
    loadingCaption.innerHTML = 'probes';
    await this.loadProbes();
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
            const texture = new TextureLoader().load(
              `baked-small/${bakedMap.filename}`,
              resolve
            );

            console.log('bakedMap.uv_index', bakedMap.uv_index);
            texture.channel = bakedMap.uv_index;
            texture.flipY = false;
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

  async loadProbes() {
    const probeLoader = new ProbeLoader(this.renderer);

    const data = await probeLoader.loadJSON('baked-small/probes.json');

    this._staticObjectsNames = [];

    data.visibility_collections.forEach((collection) => {
      this._staticObjectsNames.push(...collection.objects);
    });

    this.probeHandler = await probeLoader.setData(data);

    if (this.probeHandler.globalEnv) {
      this.scene.background =
        this.probeHandler.globalEnv.reflectionCubeProbe.texture;
    }

    await this.loadLightMaps(data);
  }

  async loadScene() {
    const loader = new GLTFLoader();

    this.staticObjectsGroup = new Group();
    this.probedObjectsGroup = new Group();
    this.scene.add(this.staticObjectsGroup, this.probedObjectsGroup);

    this.sunLight = new DirectionalLight(0xffffff, 1);
    this.sunLight.lookAt(new Vector3(-1, 0, -0.1));
    this.sunLight.shadow.camera.left *= 5;
    this.sunLight.shadow.camera.right *= 5;
    this.sunLight.shadow.camera.top *= 5;
    this.sunLight.shadow.camera.bottom *= 5;
    this.sunLight.shadow.camera.far *= 5;

    this.scene.add(this.sunLight);

    this.sunLight.castShadow = true;

    const gltf = await loader.loadAsync(
      'models/sponza-small/sponza-small.gltf'
    );

    const materials: MeshStandardMaterial[] = gltf.scene.children
      .filter((child) => child instanceof Mesh)
      .map((mesh) => (mesh as Mesh).material as MeshStandardMaterial)
      .filter((material, index, self) => self.indexOf(material) === index);

    materials.forEach((material) => {
      console.log('material.side', material.side);
    });

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i];
      let addToScene = false;

      const isStatic = this._staticObjectsNames.includes(mesh.name);

      if (mesh.name === 'sun_placeholder') {
        this.sunLight.position.copy(mesh.position);
        this.sunLight.rotation.copy(mesh.rotation);
        this.sunLight.matrixWorldNeedsUpdate;
      }

      if (mesh instanceof Mesh) {
        if (isStatic) {
          const bakedMaterialMap = this._bakedMaterialMap.find((m) => {
            return m.objectNames.includes(mesh.name);
          });

          if (bakedMaterialMap) {
            mesh.material.lightMap = bakedMaterialMap.lightMap;
            mesh.material.lightMapIntensity = 3;
          }
        }else{
          mesh.material = new MeshProbeStandardMaterial(this.probeHandler, mesh.material);
        }

        addToScene = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }

      if (addToScene) {
        i--;
        if (isStatic) {
          this.staticObjectsGroup.add(mesh);
        } else {
          this.probedObjectsGroup.add(mesh);
        }
      }
    }
  }

  protected setupCamera() {
    this.scene.add(this.camera);

    const targetPos = new Vector3(0, 1, 0);

    this.camera.position.copy(targetPos).add(new Vector3(0, 3, 3));

    this.camera.lookAt(targetPos);

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
      .onChange((value) => {
        this.renderer.toneMapping = toneMappingOptions[value];
      });

    toneMappingFolder.add(guiParams, 'exposure', 0, 10).onChange((value) => {
      this.renderer.toneMappingExposure = value;
    });

    this.probesDebug = new ProbeDebugger(this.probeHandler);
    this.probesDebug.visibilityChanged = () => (this._requestRender = true);
    this.probesDebug.gui(gui);
    this.scene.add(this.probesDebug);

    if (this.sunLight) {
      const lightFolder = gui.addFolder('Sun')

      lightFolder.add(this.sunLight, 'intensity', 0, 3)
      lightFolder.add(this.sunLight, 'castShadow')
      lightFolder.add(this.sunLight.shadow, 'radius', 0, 10)
      lightFolder.add(this.sunLight.shadow, 'bias', -1, 1)
      // lightFolder.add(this.sunLight.shadow.camera, 'near', 0, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'far', 0, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'left', -100, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'right', -100, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'top', -100, 100)
      // lightFolder.add(this.sunLight.shadow.camera, 'bottom', -100, 100)
    }
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
    if (this._requestRender === true) {
      this.renderer.render(this.scene, this.camera);
      this._requestRender = false;
    }
  }
}
