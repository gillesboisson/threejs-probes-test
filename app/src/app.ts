import {
  Clock,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

import { MapControls } from 'three/examples/jsm/controls/MapControls'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Probe, AnyProbeVolume, ProbeLoader, ProbeDebugger } from './probes'
import GUI from 'lil-gui'
import { DynamicProbeDebugger } from './probes/debug/DynamicProbeDebugger'

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
      // console.log(c.name)
      return c.name === 'Sun_Placeholder'
    })

    if (sunPlaceholder) {
      const light = new DirectionalLight(0xffffff, 1)
      light.position.set(13, 25, 0)
      light.rotation.set(0, 0, 0)
      this.scene.add(light)
    }

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {
        if (this.probeScene.environment) {
          mesh.material.envMap = this.probeScene.environment
          console.log('mesh.material.envMap',mesh.material.envMap);
        }
        // mesh.material = whiteDebugMaterial
      }

      // if (mesh instanceof Mesh || mesh instanceof Light) {
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

    this.scene.add(this.probesDebug, this.dynamicProbeDebug)
  }

  async loadProbes() {
    const probeLoader = new ProbeLoader(this.renderer)

    this.probeScene = await probeLoader.load('probes/probes.json')

    if (this.probeScene.environment) {
      this.scene.background = this.probeScene.environment
    }

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
    // }
  }
}
