import {
  BoxGeometry,
  Clock,
  HemisphereLight,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class App {
  protected clock = new Clock()
  protected scene = new Scene()
  protected renderer = new WebGLRenderer()

  protected camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
  )

  protected controls: OrbitControls

  private _refreshClosure = () => this.refresh()

  protected async initScene() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    // const hem = new HemisphereLight(0xffffbb, 0x080820, 1)
    // this.scene.add(hem)

    // this.scene.add(...this.loader.bodyEntities)
  }

  async init() {
    await this.initScene()

    this.start()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
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

  update(deltaTime: number, frameRatio: number) {}

  render(deltaTime: number, frameRatio: number) {
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
  }
}
