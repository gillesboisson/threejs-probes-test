import {
  BoxGeometry,
  Clock,
  CubeTexture,
  HemisphereLight,
  Light,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  ShaderMaterial,
  Sphere,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  ProbeLoader,
  IrradianceVolumeDefinition,
  ProbeRatio,
  // IrradianceProbeHelper,
} from './probes'
import { ProbeMeshGroup } from './probes/ProbeMesh'
import { AnyProbeVolume } from './probes/ProbeVolume'
import {
  IrradianceProbeVolumeGroup,
  ProbeVolumeGroup,
  ReflectionProbeVolumeGroup,
} from './probes/ProbeVolumeGroup'
import { IrradianceProbeVolume } from './probes/IrradianceProbeVolume'
import { Probe } from './probes/Probe'
import { ReflectionProbeVolume } from './probes/ReflectionProbeVolume'
import { IrradianceProbeDebugMaterial } from './probes/IrradianceProbeDebugger'
import { ReflectionProbeDebugMaterial } from './probes/ReflectionProbeDebugMaterial'

const orthoWidth = 60
export class App {
  protected clock = new Clock()
  protected scene = new Scene()
  protected renderer = new WebGLRenderer()

  protected camera = new OrthographicCamera(
    -orthoWidth / 2,
    orthoWidth / 2,
    (orthoWidth / 2) * (window.innerHeight / window.innerWidth),
    (-orthoWidth / 2) * (window.innerHeight / window.innerWidth),
    0.01,
    
    1000
  )

  protected controls: OrbitControls

  protected irradianceVolumes = new IrradianceProbeVolumeGroup()
  protected reflectionVolumes = new ReflectionProbeVolumeGroup()

  private _refreshClosure = () => this.refresh()
  probeDebug: Mesh
  cubemapTextures: CubeTexture[] = []
  refPlane: Plane
  rayCaster: Raycaster
  debugObject: Mesh<SphereGeometry, ReflectionProbeDebugMaterial>
  probes: Readonly<Probe>[]
  probeVolumes: AnyProbeVolume[]
  private _requestRender = true

  protected async initScene() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)
  }

  async init() {
    await this.initScene()

    this.start()

    const loader = new GLTFLoader()

    const gltf = await loader.loadAsync('models/baking-probs.gltf')

    const whiteDebugMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    })

    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {
        mesh.material = whiteDebugMaterial
      }

      // if (mesh instanceof Mesh || mesh instanceof Light) {
      if (mesh instanceof Mesh) {
        this.scene.add(mesh)
        i--
      }
    }

    this.scene.add(this.camera)

    this.camera.position.z = 0
    this.camera.position.y = 30
    this.camera.position.x = 0

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    await this.loadProbes()
  }

  async loadProbes() {
    const probeLoader = new ProbeLoader()

    this.probeVolumes = await probeLoader.load('probes/probes.json')


    this.probes = this.probeVolumes
      .map((v) => v.probes)
      .flat()


    console.log('this.probes',this.probes);

    this.probeVolumes
      .filter((v) => v instanceof IrradianceProbeVolume)
      .forEach((v) => {
        this.irradianceVolumes.addVolume(v as IrradianceProbeVolume)
      })

      
    this.probeVolumes
      .filter((v) => v instanceof ReflectionProbeVolume)
      .forEach((v) => {
        this.reflectionVolumes.addVolume(v as ReflectionProbeVolume)
      })



    const probeMeshGroup = new ProbeMeshGroup(this.probes)

    this.scene.add(probeMeshGroup)


    this.debugObject = new Mesh(new SphereGeometry(2, 16, 16), new ReflectionProbeDebugMaterial())

    this.scene.add(this.debugObject)

    this.refPlane = new Plane(new Vector3(0, 1, 0), -3)
    this.rayCaster = new Raycaster()

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.updateRaycaster(
        (e.clientX / window.innerWidth) * 2 - 1,
        (-e.clientY / window.innerHeight) * 2 + 1
      )
    })

    this.updateRaycaster(window.innerWidth / 2, window.innerHeight / 2)
  }

  updateRaycaster(x: number, y: number) {
    this.rayCaster.setFromCamera(new Vector2(x, y), this.camera)
    this.rayCaster.ray.intersectPlane(this.refPlane, this.debugObject.position)

    // this.debugObject.position.set(10, 7, 10)
    this.updateProbeDebug()
  }

  updateProbeDebug() {
    const irradianceProbesAround: ProbeRatio[] = []
    const reflectionProbesAround: ProbeRatio[] = []

    this.irradianceVolumes.getSuroundingProbes(
      this.debugObject.position,
      irradianceProbesAround
    )

    this.reflectionVolumes.getSuroundingProbes(
      this.debugObject.position,
      reflectionProbesAround
    )

    this.debugObject.material.updateProbeRatio(reflectionProbesAround);

    this._requestRender = true
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
    if (this._requestRender === true) {
      this.renderer.setRenderTarget(null)
      this.renderer.render(this.scene, this.camera)
      this._requestRender = false
    }
  }
}
