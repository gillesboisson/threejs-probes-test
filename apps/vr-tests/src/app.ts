import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferGeometry,
  CineonToneMapping,
  Clock,
  Color,
  CustomToneMapping,
  DirectionalLight,
  EquirectangularReflectionMapping,
  HemisphereLight,
  Line,
  LinearToneMapping,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  NearestFilter,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Quaternion,
  ReinhardToneMapping,
  RepeatWrapping,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

import { MapControls } from 'three/examples/jsm/controls/MapControls'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { AppNavigation } from './AppNavigation'
import {
  ProbeLoader,
  BakingJSON,
  ProbeVolumeHandler,
  LightMapJSON,
  GlobalEnvProbeVolumeJSON,
  ReflectionProbeVolumeJSON,
} from '@libs/probes'
import GUI from 'lil-gui'
import { DenoiserPass } from './shader/Denoiser'

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

type LoadedLightMap = LightMapJSON & { texture: Texture }

export class App {
  protected clock = new Clock()
  protected scene = new Scene()
  protected renderer = new WebGLRenderer({
    antialias: true,
    depth: true,
  })
  protected lightMaps: LoadedLightMap[]

  protected camera: PerspectiveCamera

  private _refreshClosure = () => this.refresh()

  sunLight: DirectionalLight
  vrStartPosition: Vector3 = new Vector3(0, 0, 0)
  vrStartRotation = new Quaternion()

  appNavigation: AppNavigation

  collisionsObjects: Mesh[] = []
  probes: ProbeVolumeHandler
  controls: MapControls
  envMap: Texture | null = null
  staticsVisibilityObjectNames: string[]
  bakeMaps: { filename: string; texture: Texture; objectNames: string[] }[]
  backgroundMap: any

  protected denoiserPass: DenoiserPass = new DenoiserPass()
  protected denoiser: EffectComposer

  async init() {
    const loadingCaption = document.getElementById('loading_caption')
    const loading = document.getElementById('loading')

    await this.setupRenderer()

    // console.log('this.denoiser', this.denoiser)

    loadingCaption.innerHTML = 'scene'
    await this.loadGI()
    await this.loadScene()
    loadingCaption.innerHTML = 'setup'
    this.setupCamera()
    this.initDebug()

    // await this.initVR()

    // this.initDebug()
    this.start()

    loading.remove()
  }

  async initVR() {
    const renderer = this.renderer
    const scene = this.scene
    renderer.xr.enabled = true

    this.appNavigation = new AppNavigation(
      renderer,
      scene,
      [...this.collisionsObjects],
      this.vrStartPosition,
      this.vrStartRotation
    )

    document.body.appendChild(VRButton.createButton(renderer))

    // renderer.xr.addEventListener('sessionstart', () => {
    //   this.renderer.xr.getCamera().cameras.forEach((camera) => {
    //     camera.layers.enableAll()
    //   })
    // })
  }

  protected async setupRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.denoiser = new EffectComposer(this.renderer)
    this.denoiserPass = new DenoiserPass()
    this.denoiser.addPass(this.denoiserPass)
    this.denoiserPass.renderToScreen = true

    const controller1 = this.renderer.xr.getController(0)
    this.scene.add(controller1)

    document.body.appendChild(this.renderer.domElement)

    const infoPanel = document.createElement('div')
    infoPanel.id = 'info-panel'
    document.body.appendChild(infoPanel)
  }

  async loadScene() {
    const loader = new GLTFLoader()

    const gltf = await loader.loadAsync('scenes/ref-scene.gltf')

    const objects: Object3D[] = []

    if (this.backgroundMap) {
      this.scene.background = this.backgroundMap
    }

    gltf.scene.traverse((child) => {
      if (child.name === 'vr_start_pos') {
        this.vrStartPosition = child.position.clone()
        this.vrStartRotation = child.quaternion.clone()
      } else if (child.name.includes('ceiling')) {
        ;(
          (child as Mesh).material as MeshStandardMaterial
        ).emissiveIntensity = 1
        const light = new PointLight(0xffffff, 0.7, 10)

        light.position.copy(child.position)
        light.position.y -= 0.01
        objects.push(child /*, light*/)
      } else if (child.name === 'sun_placeholder') {
      } else if (child instanceof Mesh) {
        console.log('child.material', child.material)
        const baseMat = child.material as MeshStandardMaterial

        // if child has wall in its name add it to collisions
        if (child.name.includes('wall')) {
          this.collisionsObjects.push(child)
        }

        const lightmap = this.bakeMaps.find((lm) =>
          lm.objectNames.includes(child.name)
        )

        let mat: MeshStandardMaterial

        if (lightmap) {
          mat = baseMat.clone()
          mat.transparent = false

          mat.lightMap = lightmap.texture
          mat.lightMapIntensity = 7

          child.material = mat

          const geom = child.geometry as BufferGeometry
          console.log('geom.attributes.uv1', geom.attributes.uv1)
          if (geom.attributes.uv1) {
            geom.setAttribute('uv', geom.attributes.uv1)
            // geom.deleteAttribute('uv2')
          }
        } else {
          mat = baseMat
          mat.envMap = this.envMap
          mat.envMapIntensity = lightmap ? 1 : 1.5
        }

        objects.push(child)
      }
    })

    this.scene.add(...objects)
    this.scene.add(new HemisphereLight(0xffffff, 0x000000, 0.3))
    this.camera = gltf.cameras[0] as PerspectiveCamera
  }

  async loadGI() {
    const mapsDirectory = './probes/'
    const renderCacheDirectory = './probes/__render_cache/'

    const probeData: BakingJSON = await fetch(
      `${mapsDirectory}/probes.json`
    ).then((res) => res.json())

    console.log('probeData', probeData)

    const bakeMaps: Array<{
      filename: string
      texture: Texture
      objectNames: string[]
    }> = []

    await Promise.all(
      probeData.baked_maps.map(async (lightmap) => {
        const filename = lightmap.filename
        // let bakeMap = bakeMaps[filename]
        const bakeMap = bakeMaps.find((bm) => {
          return bm.filename === filename
        })

        if (!bakeMap) {
          const exrLoader = new EXRLoader()
          const textureLoader = new TextureLoader()

          const newBakeMap = {
            filename,
            texture: null,
            objectNames: [lightmap.object_name],
          }

          bakeMaps.push(newBakeMap)
          const ext = filename.split('.').pop().toLowerCase()
          const fileWithPng = filename.replace(`.${ext}`, '.png')
          newBakeMap.texture =
            ext === 'exr'
              ? await exrLoader.loadAsync(`${mapsDirectory}/${filename}`)
              : await textureLoader.loadAsync(`${mapsDirectory}/${filename}`)


          this.denoiserPass.texture = newBakeMap.texture

          // this.denoiserPass.textureID = (newBakeMap.texture as Texture).uuid

          // newBakeMap.texture = await textureLoader.loadAsync(
          //   `${mapsDirectory}/${fileWithPng}`
          // )

          // newBakeMap.texture.needsUpdate = true

          // if (ext === 'exr') {
          newBakeMap.texture.flipY = true
          // }
        } else {
          bakeMap.objectNames.push(lightmap.object_name)
        }
      })
    )

    // bakeMaps.forEach((bakeMap) => {
    //   bakeMap.texture.minFilter = NearestFilter
    //   bakeMap.texture.magFilter = NearestFilter
    //   bakeMap.texture.wrapS = RepeatWrapping
    //   bakeMap.texture.wrapT = RepeatWrapping
    //   bakeMap.texture.flipY = true
    //   bakeMap.texture.needsUpdate = true
    // });

    this.bakeMaps = bakeMaps

    const exrLoader = new EXRLoader()

    // load probe panos directly from render cache
    this.envMap = await exrLoader.loadAsync(
      `${renderCacheDirectory}/room_reflection/pano.exr`
    )
    this.envMap.mapping = EquirectangularReflectionMapping

    this.backgroundMap = await exrLoader.loadAsync(
      `${renderCacheDirectory}/env/env.exr`
    )
    this.backgroundMap.mapping = EquirectangularReflectionMapping

    // await loader.load('./probes/probes.json')
  }

  protected setupCamera() {
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    } else {
      this.camera = new PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
    }

    this.camera.layers.enable(1)

    this.scene.add(this.camera)

    const targetPos = new Vector3(0, 1.6, 0)
    this.camera.lookAt(targetPos)
    this.controls = new MapControls(this.camera, this.renderer.domElement)
    this.controls.target.copy(targetPos)
    this.controls.update()

    // console.log('this.camera', this.camera)
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

    const denoiserFolder = gui.addFolder('Denoiser')

    denoiserFolder.add(this.denoiserPass, 'uSigma', 0, 20, 0.01)
    denoiserFolder.add(this.denoiserPass, 'uKSigma', 0, 20, 0.01)
    denoiserFolder.add(this.denoiserPass, 'uThreshold', 0, 1, 0.01)
    // denoiserFolder.add(this.denoiserPass, 'invGamma', 0, 1, 0.01)


  }

  start() {
    this.clock.start()
    this.refresh(0)

    this.renderer.setAnimationLoop(this._refreshClosure)
    this._refreshClosure()
  }

  stop() {
    this.clock.stop()
    this.renderer.setAnimationLoop(null)
  }

  refresh(forcedDeltaTime: number = -1) {
    if (this.clock.running) {
      const clockDeltaTime = this.clock.getElapsedTime()
      const deltaTime =
        forcedDeltaTime !== -1 ? forcedDeltaTime : clockDeltaTime
      const frameRatio = (deltaTime * 1) / 60

      this.update(deltaTime, frameRatio)
      this.render(deltaTime, frameRatio)

      // window.requestAnimationFrame(this._refreshClosure)
    }
  }

  update(deltaTime: number, frameRatio: number) {
    if (this.appNavigation) {
      this.appNavigation.update()
    }
  }

  protected frameSeconds = 0

  render(deltaTime: number, frameRatio: number) {
    // this.renderer.render(this.scene, this.camera)

    this.frameSeconds += 1;
    if (this.frameSeconds % 10 === 0) {
      this.denoiser.render()
    }

    
  }
}
