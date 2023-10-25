import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  ClampToEdgeWrapping,
  Clock,
  CubeTexture,
  CustomToneMapping,
  DirectionalLight,
  ImageLoader,
  LinearFilter,
  LinearToneMapping,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  NoToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  ReinhardToneMapping,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three'

import { MapControls } from 'three/examples/jsm/controls/MapControls'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  Probe,
  AnyProbeVolume,
  ProbeLoader,
  ProbeDebugger,
  CubemapWrapper,
  CubemapWrapperLayout,
} from './probes'
import GUI from 'lil-gui'
import { DynamicProbeDebugger } from './probes/debug/DynamicProbeDebugger'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

const mapColLayout: CubemapWrapperLayout = {
  coords: [
    new Vector2(0, 0),
    new Vector2(1 / 3, 0),
    new Vector2(2 / 3, 0),
    new Vector2(0, 1 / 2),
    new Vector2(1 / 3, 1 / 2),
    new Vector2(2 / 3, 1 / 2),
  ],
  size: new Vector2(1 / 3, 1 / 2),
}

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

  probes: Readonly<Probe>[]
  probeVolumes: AnyProbeVolume[]

  probesDebug: ProbeDebugger
  dynamicProbeDebug: DynamicProbeDebugger
  probeScene: import('/home/gillesboisson/Projects/sandbox/threejs-probes/app/src/probes/ProbesScene').ProbesScene
  cubemapWrapper: CubemapWrapper
  sourceEnv: any
  targetEnv: CubeTexture

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

    if (sunPlaceholder) {
      const light = new DirectionalLight(0xffffff, 1)
      light.position.set(13, 25, 0)
      light.rotation.set(0, 0, 0)
      this.scene.add(light)
    }

    this.cubemapWrapper = new CubemapWrapper(this.renderer, {
      minFilter: NearestFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
    })

    const hdrLoader = new RGBELoader()
    const exrLoader = new EXRLoader()
    const textureLoader = new TextureLoader()

    // this.sourceEnv = await new Promise<Texture>(function (resolve) {
    //   hdrLoader.load('./probes/Global probe.hdr', resolve)
    // })

    this.sourceEnv = await new Promise<Texture>(function (resolve,err) {
      exrLoader.load('./probes/Global probe.exr', resolve, undefined, err)
    })
    this.sourceEnv = await new Promise<Texture>(function (resolve,err) {
      exrLoader.load('./probes/Global probe.exr', resolve, undefined, err)
    })

    // const panoEnv = await new Promise<Texture>(function (resolve) {
    //   hdrLoader.load('./probes/pano.hdr', resolve)
    // })

    // const panoCubemap =  new PMREMGenerator(this.renderer).fromEquirectangular(panoEnv).texture;

    // this.sourceEnv = await new Promise<Texture>(function (resolve) {
    //   textureLoader.load('./probes/Global probe.png', resolve)
    // })

    console.log('this.sourceEnv', this.sourceEnv)
    this.targetEnv = this.cubemapWrapper.wrapFromTexture(
      this.sourceEnv,
      this.sourceEnv.image.width / 3,
      mapColLayout
    )

    const panoCubemap = new PMREMGenerator(this.renderer).fromCubemap(
      this.targetEnv
    ).texture

    // this.scene.background = this.targetEnv
    this.scene.background = panoCubemap

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {
        if (this.probeScene.environment) {
          // mesh.material.envMap = this.probeScene.environment
        }
      }

      if (mesh instanceof Mesh) {
        this.scene.add(mesh)
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

    this.probesDebug = new ProbeDebugger(this.probeVolumes)
    this.probesDebug.gui(gui)

    this.dynamicProbeDebug = new DynamicProbeDebugger(this.probeVolumes)
    this.dynamicProbeDebug.gui(gui)

    // tone mapping gui

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

    this.scene.add(this.probesDebug, this.dynamicProbeDebug)
  }

  async loadProbes() {
    const probeLoader = new ProbeLoader(this.renderer)

    this.probeScene = await probeLoader.load('probes/probes.json')

    this.probeVolumes = this.probeScene.volumes
    this.probes = this.probeVolumes.map((v) => v.probes).flat()

    this.initDebug()
  }

  updateProbeDebug() {
    this.dynamicProbeDebug.updatePosition(this.controls.target)
  }

  start() {
    this.clock.start()
    this.refresh(0)
    window.requestAnimationFrame(this._refreshClosure)
  }

  stop() {
    this.clock.start()
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
  }
}
