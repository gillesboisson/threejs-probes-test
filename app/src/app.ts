import {
  ACESFilmicToneMapping,
  AddOperation,
  CineonToneMapping,
  Clock,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CustomToneMapping,
  DirectionalLight,
  Group,
  LinearToneMapping,
  Material,
  Mesh,
  MixOperation,
  MultiplyOperation,
  NoToneMapping,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'

import { MapControls } from 'three/examples/jsm/controls/MapControls'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  ProbeLoader,
  ProbeDebugger,
  DynamicProbeDebugger,
  ProbeVolumeHandler,
  MeshProbeLambertMaterial,
  MeshProbePhongMaterial,
  MeshProbePhysicalMaterial,
  MeshProbeStandardMaterial,
} from './probes'
import GUI from 'lil-gui'

const guiParams = {
  exposure: 1.0,
  toneMapping: 'ACESFilmic',
  blurriness: 0.3,
  intensity: 1.0,
}

const toneMappingOptions = {
  None: NoToneMapping,
  Linear: LinearToneMapping,
  Reinhard: ReinhardToneMapping,
  Cineon: CineonToneMapping,
  ACESFilmic: ACESFilmicToneMapping,
  Custom: CustomToneMapping,
}

type AppDebugMaterials = {
  phong: MeshProbePhongMaterial
  standard: MeshProbeStandardMaterial
  lambert: MeshProbeLambertMaterial
  physical: MeshProbePhysicalMaterial
}

export class App {
  protected clock = new Clock()
  protected scene = new Scene()
  protected renderer = new WebGLRenderer()
  protected materials: AppDebugMaterials

  protected camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  // protected camera = new OrthographicCamera(
  //   -30,
  //   30,
  //   30 * (window.innerHeight / window.innerWidth),
  //   -30 * (window.innerHeight / window.innerWidth),
  //   0.1,
  //   1000
  // )

  protected controls: MapControls
  private _refreshClosure = () => this.refresh()

  protected probesDebug: ProbeDebugger
  protected dynamicProbeDebug: DynamicProbeDebugger
  protected probeHandler: ProbeVolumeHandler
  protected probeDebugMesh: Mesh
  protected staticObjectsGroup: Group
  protected probedObjectsGroup: Group
  protected currentDebugMaterialKey: keyof AppDebugMaterials = 'standard'

  get currentDebugMaterial() {
    return this.materials[this.currentDebugMaterialKey]
  }

  async init() {
    const loadingCaption = document.getElementById('loading_caption')
    const loading = document.getElementById('loading')

    await this.setupRenderer()
    loadingCaption.innerHTML = 'probes'
    await this.loadProbes()
    loadingCaption.innerHTML = 'scene'
    await this.loadScene()
    loadingCaption.innerHTML = 'setup'
    this.setupCamera()
    this.initDebug()
    this.start()

    loading.remove()
  }

  protected async setupRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    const infoPanel = document.createElement('div')
    infoPanel.id = 'info-panel'
    document.body.appendChild(infoPanel)

    infoPanel.innerHTML = `Drag with right click to move the camera. <br> Draw with left rotate camera.`
  }

  async loadProbes() {
    const probeLoader = new ProbeLoader(this.renderer)

    this.probeHandler = await probeLoader.load('probes/probes.json')

    if (this.probeHandler.globalEnv) {
      this.scene.background =
        this.probeHandler.globalEnv.reflectionCubeProbe.texture
    }
  }

  async loadScene() {
    const loader = new GLTFLoader()

    const gltf = await loader.loadAsync('models/baking-probs.gltf')

    // Setup main light -----------------------------------------------

    // a light placeholder is taken from the gltf as directionnal light are not exported by blender
    const sunPlaceholder = gltf.scene.children.find((c) => {
      return c.name === 'Sun_Placeholder'
    })

    if (sunPlaceholder) {
      // light setup
      const light = new DirectionalLight(0xffffff, 1)
      light.position.set(30, 30, 30)
      light.rotation.copy(sunPlaceholder.rotation)
      this.scene.add(light)

      // shadow setup
      light.castShadow = true
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
      light.shadow.camera.near = 0.5
      light.shadow.camera.far = 100
      light.shadow.bias = -0.001
      light.shadow.radius = 1
      light.shadow.camera.left = -30
      light.shadow.camera.right = 30
      light.shadow.camera.top = 30
      light.shadow.camera.bottom = -30

      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = PCFSoftShadowMap
    }

    this.staticObjectsGroup = new Group()
    this.probedObjectsGroup = new Group()
    this.scene.add(this.staticObjectsGroup, this.probedObjectsGroup)

    this.materials = {
      phong: new MeshProbePhongMaterial(this.probeHandler),
      standard: new MeshProbeStandardMaterial(this.probeHandler),
      lambert: new MeshProbeLambertMaterial(this.probeHandler),
      physical: new MeshProbePhysicalMaterial(this.probeHandler),
      // basic: new MeshProbeBasicMaterial(this.probeHandler),
    }

    // filter / map loaded scene objects / materials -----------------------------------------------
    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {
        if (mesh.name.toLowerCase().includes('suza')) {
          mesh.material = new MeshProbeStandardMaterial(this.probeHandler)
          this.probedObjectsGroup.add(mesh)
        } else {
          if (this.probeHandler.globalEnv) {
            mesh.material.envMap =
              this.probeHandler.globalEnv.reflectionCubeProbe.texture
          }
          this.staticObjectsGroup.add(mesh)
        }

        mesh.castShadow = true
        mesh.receiveShadow = true

        i--
      }
    }
  }

  protected setupCamera() {
    // Setup camera and controls -----------------------------------------------
    this.scene.add(this.camera)

    const targetPos = new Vector3(0, 5, 5)

    this.camera.position.copy(targetPos).add(new Vector3(5, 10, 10))

    this.camera.lookAt(targetPos)

    this.controls = new MapControls(this.camera, this.renderer.domElement)
    this.controls.target.copy(targetPos)
    this.controls.update()
  }

  protected initDebug() {
    const gui = new GUI()

    gui.title('Three JS Probes Volume')

    // tone mapping
    this.renderer.toneMapping = toneMappingOptions[guiParams.toneMapping]
    this.renderer.toneMappingExposure = guiParams.exposure

    const toneMappingFolder = gui.addFolder('Tone Mapping')
    toneMappingFolder
      .add(guiParams, 'toneMapping', Object.keys(toneMappingOptions))
      .onChange((value) => {
        this.renderer.toneMapping = toneMappingOptions[value]
      })

    toneMappingFolder.add(guiParams, 'exposure', 0, 10).onChange((value) => {
      this.renderer.toneMappingExposure = value
    })

    // display probes

    this.probesDebug = new ProbeDebugger(this.probeHandler)
    this.probesDebug.gui(gui)
    this.scene.add(this.probesDebug)

    // dynamic disabled for now
    // this.dynamicProbeDebug = new DynamicProbeDebugger(this.probeHandler)
    // this.dynamicProbeDebug.gui(gui)
    // this.scene.add(this.dynamicProbeDebug)

    // sphere following camera with standard material

    this.probeDebugMesh = new Mesh(
      new SphereGeometry(1, 32, 32),
      this.currentDebugMaterial
    )

    this.probeDebugMesh.castShadow = true
    this.probeDebugMesh.receiveShadow = true

    const onotherProbeDebugMeshMat = new MeshProbeStandardMaterial(
      this.probeHandler
    )
    onotherProbeDebugMeshMat.copy(this.currentDebugMaterial)

    // const onotherProbeDebugMesh = new Mesh(new SphereGeometry(1, 32, 32),onotherProbeDebugMeshMat);
    const onotherProbeDebugMesh = new Mesh(
      new SphereGeometry(1, 32, 32),
      this.probeDebugMesh.material
    )
    onotherProbeDebugMesh.name = 'onotherProbeDebugMesh'
    this.probeDebugMesh.name = 'probeDebugMesh'

    this.probedObjectsGroup.add(this.probeDebugMesh, onotherProbeDebugMesh)

    const groupVisibilityFolder = gui.addFolder('Objects Groups')
    groupVisibilityFolder
      .add(this.staticObjectsGroup, 'visible')
      .name('Static objects')
    groupVisibilityFolder
      .add(this.probedObjectsGroup, 'visible')
      .name('Probed objects')

    // material GUI

    const targetObjectGUIFolders: Record<keyof AppDebugMaterials, GUI> =
      {} as any

    let targetObjectMaterialGUIFolder = gui.addFolder('Target object material')
    // const materialOptions: Record<keyof AppDebugMaterials, Material> = {} as any

    // Object.keys(this.materials).forEach((key) => {
    //   materialOptions[key] = this.materials[key as keyof AppDebugMaterials]
    // })

    const updateMaterialFolderVisibility = (value: string) => {
      this.probeDebugMesh.material = this.materials[value]
      for (let key in targetObjectGUIFolders) {
        if (value === key) {
          targetObjectGUIFolders[key].show()
        } else {
          targetObjectGUIFolders[key].hide()
        }
      }
    }

    targetObjectMaterialGUIFolder
      .add(this, 'currentDebugMaterialKey', Object.keys(this.materials))
      .onChange(updateMaterialFolderVisibility)
      .name('Material')

    // targetObjectMaterialGUIFolder.add

    let targetObjectGUIFolder =
      targetObjectMaterialGUIFolder.addFolder('Standard material')
    targetObjectGUIFolder.add(this.materials.standard, 'probesIntensity', 0, 1)
    targetObjectGUIFolder.addColor(this.materials.standard, 'color')
    targetObjectGUIFolder.add(this.materials.standard, 'roughness', 0.01, 0.95)
    targetObjectGUIFolder.add(this.materials.standard, 'metalness', 0, 1)
    targetObjectGUIFolders.standard = targetObjectGUIFolder

    targetObjectGUIFolder =
      targetObjectMaterialGUIFolder.addFolder('Physical material')
    targetObjectGUIFolder.add(this.materials.physical, 'probesIntensity', 0, 1)
    targetObjectGUIFolder.addColor(this.materials.physical, 'color')
    targetObjectGUIFolder.add(this.materials.physical, 'roughness', 0.01, 0.95)
    targetObjectGUIFolder.add(this.materials.physical, 'metalness', 0, 1)
    targetObjectGUIFolder.addColor(this.materials.physical, 'specularColor')
    targetObjectGUIFolder.add(
      this.materials.physical,
      'specularIntensity',
      0,
      1
    )
    targetObjectGUIFolder.add(this.materials.physical, 'iridescence', 0, 1)
    targetObjectGUIFolder.add(this.materials.physical, 'anisotropy', 0, 1)
    targetObjectGUIFolder.add(
      this.materials.physical,
      'anisotropyRotation',
      0,
      Math.PI * 2
    )
    targetObjectGUIFolder.addColor(this.materials.physical, 'sheenColor')
    targetObjectGUIFolder.add(this.materials.physical, 'sheen', 0, 1)
    targetObjectGUIFolder.add(this.materials.physical, 'sheenRoughness', 0, 1)
    targetObjectGUIFolder.add(this.materials.physical, 'thickness', 0, 10)
    targetObjectGUIFolder.add(
      this.materials.physical,
      'attenuationDistance',
      0,
      50
    )
    
    targetObjectGUIFolder.addColor(this.materials.physical, 'attenuationColor')
    targetObjectGUIFolders.physical = targetObjectGUIFolder

    targetObjectGUIFolder =
      targetObjectMaterialGUIFolder.addFolder('Lambert material')
    targetObjectGUIFolder.addColor(this.materials.lambert, 'color')
    targetObjectGUIFolder.add(this.materials.lambert, 'reflectivity', 0, 1)
    targetObjectGUIFolder.add(this.materials.lambert, 'refractionRatio', 0, 1)
    targetObjectGUIFolder.add(this.materials.lambert, 'combine', [
      0,
      MultiplyOperation,
      AddOperation,
      MixOperation,
    ])
    targetObjectGUIFolder.add(this.materials.lambert, 'probeMapMode', [
      CubeReflectionMapping,
      CubeRefractionMapping,
    ]);


    targetObjectGUIFolders.lambert = targetObjectGUIFolder

    targetObjectGUIFolder =
      targetObjectMaterialGUIFolder.addFolder('Phong material')
    targetObjectGUIFolder.addColor(this.materials.phong, 'color')
    targetObjectGUIFolder.addColor(this.materials.phong, 'specular')
    targetObjectGUIFolder.add(this.materials.phong, 'shininess', 0, 100)
    targetObjectGUIFolder.add(this.materials.phong, 'reflectivity', 0, 1)
    targetObjectGUIFolder.add(this.materials.phong, 'refractionRatio', 0, 1)
    targetObjectGUIFolder.add(this.materials.phong, 'combine', [
      0,
      MultiplyOperation,
      AddOperation,
      MixOperation,
    ])
    targetObjectGUIFolder.add(this.materials.phong, 'probeMapMode', [
      CubeReflectionMapping,
      CubeRefractionMapping,
    ]);
    targetObjectGUIFolders.phong = targetObjectGUIFolder

    // targetObjectGUIFolder =
    //   targetObjectMaterialGUIFolder.addFolder('Basic material')
    // targetObjectGUIFolder.addColor(this.materials.basic, 'color')
    // targetObjectGUIFolder.add(this.materials.basic, 'reflectivity', 0, 1)
    // targetObjectGUIFolder.add(this.materials.basic, 'refractionRatio', 0, 1)
    // targetObjectGUIFolders.basic = targetObjectGUIFolder

    updateMaterialFolderVisibility(this.currentDebugMaterialKey)
  }

  start() {
    this.clock.start()
    this.refresh(0)
    window.requestAnimationFrame(this._refreshClosure)
  }

  stop() {
    this.clock.stop()
  }

  refresh(forcedDeltaTime: number = -1) {
    if (this.clock.running) {
      const clockDeltaTime = this.clock.getElapsedTime()
      const deltaTime =
        forcedDeltaTime !== -1 ? forcedDeltaTime : clockDeltaTime
      const frameRatio = (deltaTime * 1) / 60

      this.update(deltaTime, frameRatio)
      this.render(deltaTime, frameRatio)

      window.requestAnimationFrame(this._refreshClosure)
    }
  }

  update(deltaTime: number, frameRatio: number) {
    if (this.controls) {
      this.updateProbeDebug()
    }
  }

  updateProbeDebug() {
    if (this.probeDebugMesh) {
      this.probeDebugMesh.position.copy(this.controls.target)
    }
  }

  render(deltaTime: number, frameRatio: number) {
    // if (this._requestRender === true) {

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
    // debugger
    // this.stop();
  }
}
