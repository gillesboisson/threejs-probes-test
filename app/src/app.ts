import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  Clock,
  CustomToneMapping,
  DirectionalLight,
  LinearToneMapping,
  Material,
  Mesh,
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three'

import { MapControls } from 'three/examples/jsm/controls/MapControls'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  ProbeLoader,
  ProbeDebugger,
} from './probes'
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

  // probes: Readonly<Probe>[]
  // probeVolumes: AnyProbeVolume[]

  probesDebug: ProbeDebugger
  dynamicProbeDebug: DynamicProbeDebugger
  probeHandler: ProbeVolumeHandler
  testProbeMeshMat: MeshProbeStandardMaterial
  testProbeMesh: any

  protected async initScene() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    const infoPanel = document.createElement('div')
    infoPanel.id = 'info-panel'
    document.body.appendChild(infoPanel)

    infoPanel.innerHTML = `Drag with right click to move the camera. <br> Draw with left rotate camera.`
  }

  async init() {
    await this.initScene()
    await this.loadProbes()

    this.start()

    const loader = new GLTFLoader()

    const gltf = await loader.loadAsync('models/baking-probs.gltf')

    const sunPlaceholder = gltf.scene.children.find((c) => {
      return c.name === 'Sun_Placeholder'
    })

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap; 

    if (sunPlaceholder) {
      const light = new DirectionalLight(0xffffff, 1)

      light.castShadow = true

      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
      light.shadow.camera.near = 0.5
      light.shadow.camera.far = 500
      light.shadow.bias = -0.0002
      light.shadow.camera.left = -30
      light.shadow.camera.right = 30
      light.shadow.camera.top = 30
      light.shadow.camera.bottom = -30

      light.position.set(30,30,30)
      light.rotation.copy(sunPlaceholder.rotation)
      this.scene.add(light)
    }

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {

       
        

        // const mat = new MeshProbeStandardMaterial(this.probeHandler)
        // mat.copy(mesh.material)

        // if (this.probeHandler.globalEnv) {
        //   mat.envMap = this.probeHandler.globalEnv.reflectionCubeProbe.texture
        // }

        // mesh.material = mat
      }

      if (mesh instanceof Mesh) {
        this.scene.add(mesh)
        mesh.castShadow = true
        mesh.receiveShadow = true

        i--
      }
    }

    this.scene.add(this.camera)

    this.camera.position.z = 5
    this.camera.position.y = 10
    this.camera.position.x = -5

    this.camera.lookAt(0, 5, 0)

    this.controls = new MapControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 3, 0)
    this.controls.update()
  }

  protected initDebug() {
    const gui = new GUI()

    gui.title('Three JS Probe Volume Debugger')

    this.probesDebug = new ProbeDebugger(this.probeHandler)
    this.probesDebug.gui(gui)

    this.dynamicProbeDebug = new DynamicProbeDebugger(this.probeHandler)
    this.dynamicProbeDebug.gui(gui)

    // tone mapping gui

    this.renderer.toneMapping = toneMappingOptions[guiParams.toneMapping]
    this.renderer.toneMappingExposure = guiParams.exposure

    this.testProbeMeshMat = new MeshProbeStandardMaterial(this.probeHandler)
    this.testProbeMeshMat
    // this.testProbeMeshMat = new MeshStandardMaterial({
    //   // color: 0xff0000,
    // })

    this.testProbeMesh = new Mesh(
      new SphereGeometry(1, 32, 32),
      this.testProbeMeshMat
    )

    this.testProbeMesh.castShadow = true
    this.testProbeMesh.receiveShadow = true

    const folder = gui.addFolder('Test Probe')
    folder.addColor(this.testProbeMeshMat, 'color')
    folder.addColor(this.testProbeMeshMat, 'emissive')
    folder.add(this.testProbeMeshMat, 'roughness', 0.01, 0.95)
    folder.add(this.testProbeMeshMat, 'metalness', 0, 1)
    folder.add(this.testProbeMeshMat, 'envMapIntensity', 0, 1)

    this.scene.add(this.testProbeMesh)

    this.scene.add(this.probesDebug, this.dynamicProbeDebug)

    const toneMappingFolder = gui.addFolder('Tone Mapping')
    toneMappingFolder
      .add(guiParams, 'toneMapping', Object.keys(toneMappingOptions))
      .onChange((value) => {
        this.renderer.toneMapping = toneMappingOptions[value]
      })

    toneMappingFolder.add(guiParams, 'exposure', 0, 10).onChange((value) => {
      this.renderer.toneMappingExposure = value
    })
  }

  async loadProbes() {
    const probeLoader = new ProbeLoader(this.renderer)

    this.probeHandler = await probeLoader.load('probes/probes.json')

    if (this.probeHandler.globalEnv) {
      // this.scene.background =
      //   this.probeHandler.globalEnv.irradianceCubeProbe.texture
    }

    this.initDebug()
  }

  updateProbeDebug() {
    this.testProbeMesh.position.copy(this.controls.target)
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
    if (this.dynamicProbeDebug && this.controls) {
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
