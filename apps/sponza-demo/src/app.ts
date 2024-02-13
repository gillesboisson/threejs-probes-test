import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  Clock,
  Color,
  CustomToneMapping,
  Group,
  LinearToneMapping,
  Material,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

import { MapControls } from 'three/examples/jsm/controls/MapControls';

import {
  BakeLoader,
  ProbeDebugger,
  DynamicProbeDebugger,
  ProbeVolumeHandler,
  MeshProbeLambertMaterial,
  MeshProbePhongMaterial,
  MeshProbePhysicalMaterial,
  MeshProbeStandardMaterial,
  LightmapHandler,
  ConvertibleMeshProbeMaterial,
  ProbeMode,
} from '@libs/probes';
import GUI from 'lil-gui';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';

const guiParams = {
  exposure: 5,
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

export class App {
  protected clock = new Clock();
  protected scene = new Scene();
  protected renderer = new WebGLRenderer({
    antialias: true,
    alpha: false,
  });

  protected camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camRadius = 30;

  protected controls: MapControls;
  private _refreshClosure = () => this.refresh();

  protected probesDebug: ProbeDebugger;
  protected dynamicProbeDebug: DynamicProbeDebugger;
  protected probeVolumeHandler: ProbeVolumeHandler;
  protected probeDebugMesh: Mesh;

  private _requestRender: boolean = true;
  protected lightmapHandler: LightmapHandler;
  protected passesGroups: Group[];
  protected objects: Object3D[];
  protected materials: MeshStandardMaterial[];

  protected _lightMapIntensity = 1;
  protected _aoMapIntensity = 1;
  protected _displayAlbedo = true;
  protected _displayLightmap = true;
  protected _displayAOMap = true;
  protected debugObject: Mesh;

  protected _layersMask = 1 | 2 | 4 | 8;

  protected _layers = [
    {
      mask: 1,
      name: 'Lightmaps baked',
      visible: true,
    },
    {
      mask: 2,
      name: 'Static objects (probes only)',
      visible: true,
    },
    {
      mask: 4,
      name: 'Active objects',
      visible: true,
    },
  ];

  get lightMapIntensity(): number {
    return this._lightMapIntensity;
  }

  set lightMapIntensity(val: number) {
    if (val !== this._lightMapIntensity) {
      this.materials.forEach((mat) => {
        mat.lightMapIntensity = val;
      });
    }
    this._lightMapIntensity = val;
  }

  get aoMapIntensity(): number {
    return this._aoMapIntensity;
  }

  set aoMapIntensity(val: number) {
    if (val !== this._aoMapIntensity) {
      this.materials.forEach((mat) => {
        mat.aoMapIntensity = val;
      });
      this._aoMapIntensity = val;
    }
  }

  get displayAlbedo(): boolean {
    return this._displayAlbedo;
  }

  set displayAlbedo(val: boolean) {
    if (val !== this._displayAlbedo) {
      this._displayAlbedo = val;
      if (val) {
        this.materials.forEach((mat) => {
          mat.map = (mat as any).__map;
          mat.color = (mat as any).__color;
          mat.needsUpdate = true;
        });
      } else {
        this.materials.forEach((mat) => {
          (mat as any).__map = mat.map;
          (mat as any).__color = mat.color;
          mat.map = null;
          mat.color = new Color(0xffffff);
          mat.needsUpdate = true;
        });
      }
    }
  }

  get displayLightmap(): boolean {
    return this._displayLightmap;
  }

  set displayLightmap(val: boolean) {
    if (val !== this._displayLightmap) {
      this._displayLightmap = val;
      if (val) {
        this.materials.forEach((mat) => {
          mat.lightMap = (mat as any).__lightMap;
          mat.needsUpdate = true;
        });
      } else {
        this.materials.forEach((mat) => {
          (mat as any).__lightMap = mat.lightMap;
          mat.lightMap = null;
          mat.needsUpdate = true;
        });
      }
    }
  }

  get displayAOMap(): boolean {
    return this._displayAOMap;
  }

  set displayAOMap(val: boolean) {
    if (val !== this._displayAOMap) {
      this._displayAOMap = val;
      if (val) {
        this.materials.forEach((mat) => {
          mat.aoMap = (mat as any).__aoMap;
          mat.needsUpdate = true;
        });
      } else {
        this.materials.forEach((mat) => {
          (mat as any).__aoMap = mat.aoMap;
          mat.aoMap = null;
          mat.needsUpdate = true;
        });
      }
    }
  }

  async init() {
    const loadingCaption = document.getElementById('loading_caption');
    const loading = document.getElementById('loading');

    await this.setupRenderer();
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
    this.renderer.autoClear = false;

    const infoPanel = document.createElement('div');
    const copyrightPanel = document.createElement('div');
    infoPanel.id = 'info-panel';
    copyrightPanel.id = 'copyright';

    document.body.appendChild(infoPanel);
    document.body.appendChild(copyrightPanel);

    infoPanel.innerHTML = `Drag with right click to move the camera. <br> Draw wi th left rotate camera.`;
    copyrightPanel.innerHTML = `<a href="https://sketchfab.com/3d-models/victorian-living-room-824dfd61f8e348989fd346103c67bd9f">Victorian living room by Matthew Collings</a>`;
  }

  async loadScene() {
    const loader = new BakeLoader(this.renderer);

    const useLightMapLayerMask = 1;
    const useProbeStaticLayerMask = 2;
    const useActiveLayerMask = 4;
    const useProbeLayer =
      useLightMapLayerMask | useProbeStaticLayerMask | useActiveLayerMask;

    // In this example
    // - irradiance probes are used for GI only (on objects with lightmaps)
    // - reflection probes are used for all objects
    // - lightmaps are used for diffuse only on a specific group of objects

    // this is implemented by using visibility layers and bake loader filter and mapping functions

    // optimize scene by filtering and adapting elements settings based on there layers
    // Static objects : light baked object and probe static object
    //  > they will use nearest / fix probes
    //  > they will have there transform matrix update once
    //  + Static objects with lightmaps
    //     > they will not use probes for irradiance
    //  + Static probed objects
    //     > they will use nearest probes
    //     > they will be lit by active lights
    // Active objects / lights
    //    > objects they will use probes with autoupdate with interpolation mode
    //    > lights will lit all none lightmapped objects

    loader.filterProbeMesh = (mesh, handler) =>
      (mesh.layers.mask & useProbeLayer) !== 0;

    loader.mapProbeMaterial = (
      mesh,
      material: ConvertibleMeshProbeMaterial,
      handler: ProbeVolumeHandler
    ) => {
      const finalMaterial = handler.materialToProbeMaterial(material);

      const isStatic = (mesh.layers.mask & useActiveLayerMask) === 0;

      const activeProbeMode = isStatic
        ? ProbeMode.Nearest
        : ProbeMode.FragmentRatio;

      finalMaterial.autoUpdateProbes = !isStatic;
      finalMaterial.needsProbeUpdate = true;

      finalMaterial.irradianceProbeMode = finalMaterial.lightMap
        ? ProbeMode.Disabled
        : activeProbeMode;
      finalMaterial.reflectionProbeMode = activeProbeMode;

      return finalMaterial;
    };

    loader.mapObject = (object, material, handler) => {
      const isStatic = (object.layers.mask & useActiveLayerMask) === 0;

      if (isStatic) {
        object.matrixAutoUpdate = false;
        object.updateMatrix();
      }

      return object;
    };

    const { lightmapHandler, probeVolumeHandler, groups, objects } =
      await loader.loadScene(
        'scenes/licensed-victorian/scene.gltf',
        this.scene
      );

    this.passesGroups = groups;

    // based on victorian-house.gltf layers masks and current lights : layers will be splitted in two passes automatically
    // - objects with lightmaps (layer 1)
    // - objects with no lightmaps

    this.lightmapHandler = lightmapHandler;
    this.probeVolumeHandler = probeVolumeHandler;

    this.objects = objects;
    // get unique materials list

    const materials: Material[] = (this.materials = []);
    this.objects
      .filter((o) => o instanceof Mesh)
      .forEach((o: Mesh) => {
        const mesh = o as Mesh;
        if (
          mesh.material instanceof Material &&
          materials.indexOf(mesh.material) === -1
        ) {
          materials.push(mesh.material);
        }
      });

    this.debugObject = this.objects.find((o) => o.name === 'Debug') as Mesh;
  }

  protected setupCamera() {
    this.scene.add(this.camera);

    const offset = new Vector3(-2, 0, 0);
    const targetPos = offset.clone().add(new Vector3(0, 0, 0));
    const camPos = offset.clone().add(new Vector3(-5, 6, 6));

    this.camera.position.copy(camPos);

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
      .name('Tone mapping')
      .onChange((value) => {
        this.renderer.toneMapping = toneMappingOptions[value];
      });

    toneMappingFolder
      .add(guiParams, 'exposure', 0, 10)
      .name('Exposure')
      .onChange((value) => {
        this.renderer.toneMappingExposure = value;
      });

    this.probesDebug = new ProbeDebugger(this.probeVolumeHandler);
    this.probesDebug.visibilityChanged = () => (this._requestRender = true);

    const probeFolder = gui.addFolder('Probes');
    probeFolder
      .add(this.probeVolumeHandler, 'lightIntensity', 0, 10)
      .name('Intensity');
    this.probesDebug.gui(gui, probeFolder);
    this.scene.add(this.probesDebug);

    const lightmapFolder = gui.addFolder('Lightmap');

    lightmapFolder
      .add(this, 'lightMapIntensity', 0, 3)
      .name('Lightmap intensity');
    lightmapFolder.add(this, 'aoMapIntensity', 0, 1).name('AO intensity');
    lightmapFolder.add(this, 'displayAlbedo').name('Display albedo');
    lightmapFolder.add(this, 'displayLightmap').name('Display lightmap');
    lightmapFolder.add(this, 'displayAOMap').name('Display AO map');

    const layerFolder = gui.addFolder('Layers');

    for (let layer of this._layers) {
      layerFolder
        .add(layer, 'visible')
        .name(layer.name)
        .onChange(() => {
          this._layersMask = layer.visible
            ? this._layersMask | layer.mask
            : this._layersMask & ~layer.mask;

          this._requestRender = true;
        });
    }

    if (this.debugObject) {
      const debugFolder = gui.addFolder('Debug');

      debugFolder
        .add(this.debugObject.material, 'roughness', 0, 1)
        .name('Roughness');
      debugFolder
        .add(this.debugObject.material, 'metalness', 0, 1)
        .name('Metalness');
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

  protected elapsedTime = 0;

  refresh(forcedDeltaTime: number = -1) {
    if (this.clock.running) {
      const clockDeltaTime = this.clock.getElapsedTime();
      const deltaTime =
        forcedDeltaTime !== -1
          ? forcedDeltaTime
          : clockDeltaTime - this.elapsedTime;
      const frameRatio = (deltaTime * 1) / 60;

      this.elapsedTime = clockDeltaTime;

      this.update(deltaTime, frameRatio);
      this.render(deltaTime, frameRatio);

      window.requestAnimationFrame(this._refreshClosure);
    }
  }

  update(deltaTime: number, frameRatio: number) {
    if (this.controls) {
      if (this.debugObject) {
        this.debugObject.position.x = this.controls.target.x;
        this.debugObject.position.z = this.controls.target.z;
      }
    }
  }

  render(deltaTime: number, frameRatio: number) {
    if (this._requestRender === true) {
      this.renderer.clear();

      let firstLayer = true;

      if (this.debugObject) {
        this.debugObject.rotateOnAxis(
          new Vector3(0, 1, 0),
          (deltaTime * Math.PI) / 2
        );
      }

      // groups are rendered one by one
      for (let group of this.passesGroups) {
        this.scene.background =
          firstLayer && this.probeVolumeHandler.globalEnv
            ? this.probeVolumeHandler.globalEnv.irradianceCubeProbe.texture
            : null;

        this.scene.backgroundIntensity = 1;

        firstLayer = false;

        for (let g of this.passesGroups) {
          g.visible = g === group;
        }

        this.camera.layers.mask = group.layers.mask & this._layersMask;

        this.renderer.render(this.scene, this.camera);
      }
      this._requestRender = false;
    }
  }
}
