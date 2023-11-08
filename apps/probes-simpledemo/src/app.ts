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
  Mesh,
  MeshStandardMaterial,
  MixOperation,
  MultiplyOperation,
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  ReinhardToneMapping,
  Scene,
  SphereGeometry,
  Texture,
  TextureLoader,
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
} from '@libs/probes'
import GUI from 'lil-gui'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

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

  protected controls: MapControls
  private _refreshClosure = () => this.refresh()

  protected probesDebug: ProbeDebugger
  protected dynamicProbeDebug: DynamicProbeDebugger
  protected probeHandler: ProbeVolumeHandler
  protected probeDebugMesh: Mesh
  protected staticObjectsGroup: Group
  protected probedObjectsGroup: Group
  protected currentDebugMaterialKey: keyof AppDebugMaterials = 'standard'

  protected roofMeshName = 'Room-roof'
  protected wallsMeshName = 'Room-walls'
  protected sunPlaceholderName = 'Sun_Placeholder'

  protected roofMesh?: Mesh
  protected wallsMesh?: Mesh
  sunLight: DirectionalLight

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
      return c.name === this.sunPlaceholderName
    })

    this.roofMesh = gltf.scene.children.find((c) => {
      return c.name === this.roofMeshName
    }) as Mesh

    this.wallsMesh = gltf.scene.children.find((c) => {
      return c.name === this.wallsMeshName
    }) as Mesh

    if (sunPlaceholder) {
      // light setup

      const sunLight = (this.sunLight = new DirectionalLight(0xffffff, 1))
      sunLight.position.set(30, 30, 30)
      sunLight.rotation.copy(sunPlaceholder.rotation)
      this.scene.add(sunLight)

      // shadow setup
      sunLight.castShadow = true
      sunLight.shadow.mapSize.width = 2048
      sunLight.shadow.mapSize.height = 2048
      sunLight.shadow.camera.near = 0.5
      sunLight.shadow.camera.far = 100
      sunLight.shadow.bias = -0.001
      sunLight.shadow.radius = 1
      sunLight.shadow.camera.left = -30
      sunLight.shadow.camera.right = 30
      sunLight.shadow.camera.top = 30
      sunLight.shadow.camera.bottom = -30

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

    const diffuseMapsMat: [MeshStandardMaterial, string][] = []

    console.log('gltf.scene',gltf.scene);

    // filter / map loaded scene objects / materials -----------------------------------------------
    for (let i = 0; i < gltf.scene.children.length; i++) {
      const mesh = gltf.scene.children[i]
      if (mesh instanceof Mesh) {
        if (mesh.name.toLowerCase().includes('suza')) {
          const meshMat = mesh.material as MeshStandardMaterial
          mesh.material = new MeshProbeStandardMaterial(this.probeHandler)
          mesh.material.copy(meshMat)

          this.probedObjectsGroup.add(mesh)
        } else {
          if (mesh.material.userData.diffuse_map) {
            console.log('Diffuse map found for ' + mesh.material.name)

            const asStandardMat = mesh.material.isMeshStandardMaterial
              ? (mesh.material as MeshStandardMaterial)
              : undefined
            if (asStandardMat) {
              
              diffuseMapsMat.push([
                asStandardMat as MeshStandardMaterial,
                asStandardMat.userData.diffuse_map,
              ])
            }
          } else if (this.probeHandler.globalEnv) {
            mesh.material.envMap =
              this.probeHandler.globalEnv.reflectionCubeProbe.texture
          }

          this.staticObjectsGroup.add(mesh)
        }

        mesh.castShadow = true
        mesh.receiveShadow = true

        i--
      }

      console.log('mesh.name',mesh.name);

      if (mesh instanceof PointLight) {
        console.log('mesh', mesh)
        const light = mesh as PointLight
        light.intensity /= 1000
        light.decay = 5
        

        this.staticObjectsGroup.add(mesh)
      }
    }
    const lightMapDirectory = 'models/'
    const exrLoader = new EXRLoader()
    const textureLoader = new TextureLoader()
    await new Promise<void>((resolve) => {
      let loadedDiffuseMaps = 0
      let currentDiffuseMaps = 0

      const loaded = (mapIndex: number, mat: MeshStandardMaterial, texture: Texture) => {
        loadedDiffuseMaps++
        console.log('loadedDiffuseMaps', loadedDiffuseMaps)
        mat.lightMap = texture
        texture.flipY = true
        if (loadedDiffuseMaps === diffuseMapsMat.length) {
          resolve()
        } else {
          loadMap()
        }
      }

      const loadMap = () => {
        console.log(
          'loadMap',
          currentDiffuseMaps,
          diffuseMapsMat[currentDiffuseMaps]
        )
        const [mat, filename] = diffuseMapsMat[currentDiffuseMaps]
        const ext = filename.split('.').pop().toLowerCase()
        currentDiffuseMaps++
        const mapIndex = currentDiffuseMaps
        if (ext === 'exr') {
          exrLoader.load(lightMapDirectory + filename, (texture) => {
            loaded(mapIndex,mat, texture)
          })
        } else {
          textureLoader.load(lightMapDirectory + filename, (texture) => {
            loaded(mapIndex, mat,texture)
          })
        }
      }

      if (diffuseMapsMat.length > 0) {
        loadMap()
      } else {
        resolve()
      }
    })
  }

  protected setupCamera() {
    // Setup camera and controls -----------------------------------------------
    this.scene.add(this.camera)

    const targetPos = new Vector3(0, 3, 0)

    this.camera.position.copy(targetPos).add(new Vector3(0, 5, 5))

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

    // 1 material for two mesh test -----------------------------
    // const onotherProbeDebugMeshMat = new MeshProbeStandardMaterial(
    //   this.probeHandler
    // )
    // onotherProbeDebugMeshMat.copy(this.currentDebugMaterial)

    // // const onotherProbeDebugMesh = new Mesh(new SphereGeometry(1, 32, 32),onotherProbeDebugMeshMat);
    // const onotherProbeDebugMesh = new Mesh(
    //   new SphereGeometry(1, 32, 32),
    //   this.probeDebugMesh.material
    // )
    // onotherProbeDebugMesh.name = 'onotherProbeDebugMesh'
    // this.probeDebugMesh.name = 'probeDebugMesh'
    // ----------------------------------------------------------

    this.probedObjectsGroup.add(this.probeDebugMesh)

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
    ])

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
    ])
    targetObjectGUIFolders.phong = targetObjectGUIFolder

    // targetObjectGUIFolder =
    //   targetObjectMaterialGUIFolder.addFolder('Basic material')
    // targetObjectGUIFolder.addColor(this.materials.basic, 'color')
    // targetObjectGUIFolder.add(this.materials.basic, 'reflectivity', 0, 1)
    // targetObjectGUIFolder.add(this.materials.basic, 'refractionRatio', 0, 1)
    // targetObjectGUIFolders.basic = targetObjectGUIFolder

    if (this.roofMesh || this.wallsMesh) {
      const roomFolder = gui.addFolder('Room')

      if (this.roofMesh) {
        roomFolder.add(this.roofMesh, 'visible').name('Roof')
      }

      if (this.wallsMesh) {
        roomFolder.add(this.wallsMesh, 'visible').name('Walls')
      }
    }

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
