import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  Clock,
  CustomToneMapping,
  DirectionalLight,
  Group,
  LinearToneMapping,
  Material,
  Mesh,
  NoToneMapping,
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
import { ProbeLoader, ProbeDebugger } from './probes'
import GUI from 'lil-gui'
import { DynamicProbeDebugger } from './probes/debug/DynamicProbeDebugger'
import { ProbeVolumeHandler } from './probes/ProbeVolumeHandler'
import { MeshProbeStandardMaterial } from './probes/materials'

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

export class App {
  protected clock = new Clock()
  protected scene = new Scene()
  protected renderer = new WebGLRenderer()

  protected camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  protected controls: MapControls
  private _refreshClosure = () => this.refresh()

  probesDebug: ProbeDebugger
  dynamicProbeDebug: DynamicProbeDebugger
  probeHandler: ProbeVolumeHandler
  testProbeMeshMat: MeshProbeStandardMaterial
  testProbeMesh: any
  staticObjectsGroup: any
  probedObjectsGroup: any

  protected async setupRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    const infoPanel = document.createElement('div')
    infoPanel.id = 'info-panel'
    document.body.appendChild(infoPanel)

    infoPanel.innerHTML = `Drag with right click to move the camera. <br> Draw with left rotate camera.`
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

    // filter / map loaded scene objects / materials -----------------------------------------------
    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {
        if (mesh.name.toLowerCase().includes('suza')) {
          const oldMat = mesh.material
          const mat = new MeshProbeStandardMaterial(this.probeHandler)
          mat.copy(oldMat)
          mesh.material = mat
          this.probedObjectsGroup.add(mesh)
        } else {
          if (this.probeHandler.globalEnv) {
            mesh.material.envMap =
              this.probeHandler.globalEnv.reflectionCubeProbe.texture
          }
          this.staticObjectsGroup.add(mesh)
        }
      }

      if (mesh instanceof Mesh) {
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

  async init() {
    const loadingCaption = document.getElementById('loading_caption')


    await this.setupRenderer()
    loadingCaption.innerHTML = 'probes'
    await this.loadProbes()
    loadingCaption.innerHTML = 'scene'
    await this.loadScene()
    loadingCaption.innerHTML = 'setup'
    this.setupCamera()
    this.initDebug()
    document.getElementById('loading').remove()
    this.start()
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
    this.testProbeMeshMat = new MeshProbeStandardMaterial(this.probeHandler)
    this.testProbeMeshMat

    this.testProbeMesh = new Mesh(
      new SphereGeometry(1, 32, 32),
      this.testProbeMeshMat
    )

    this.testProbeMesh.castShadow = true
    this.testProbeMesh.receiveShadow = true
    this.probedObjectsGroup.add(this.testProbeMesh)

    const groupVisibilityFolder = gui.addFolder('Objects Groups')
    groupVisibilityFolder
      .add(this.staticObjectsGroup, 'visible')
      .name('Static objects')
    groupVisibilityFolder
      .add(this.probedObjectsGroup, 'visible')
      .name('Probed objects')

    // material GUI
    const targetObjectGUIFolder = gui.addFolder('Target object material')
    targetObjectGUIFolder.addColor(this.testProbeMeshMat, 'color')
    targetObjectGUIFolder.addColor(this.testProbeMeshMat, 'emissive')
    targetObjectGUIFolder.add(this.testProbeMeshMat, 'roughness', 0.01, 0.95)
    targetObjectGUIFolder.add(this.testProbeMeshMat, 'metalness', 0, 1)
    targetObjectGUIFolder.add(this.testProbeMeshMat, 'probesIntensity', 0, 1)
  }

  async loadProbes() {
    const probeLoader = new ProbeLoader(this.renderer)

    this.probeHandler = await probeLoader.load('probes/probes.json')

    if (this.probeHandler.globalEnv) {
      this.scene.background =
        this.probeHandler.globalEnv.reflectionCubeProbe.texture
    }
  }

  updateProbeDebug() {
    if (this.testProbeMesh) {
      this.testProbeMesh.position.copy(this.controls.target)
    }
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

  render(deltaTime: number, frameRatio: number) {
    // if (this._requestRender === true) {

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
    // this.stop();
  }
}
