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
} from './probes/ProbeVolumeGroup'
import { IrradianceProbeVolume } from './probes/IrradianceProbeVolume'
import { Probe } from './probes/Probe'
import { ReflectionProbeVolume } from './probes/ReflectionProbeVolume'

const orthoWidth = 60
export class App {
  protected clock = new Clock()
  protected scene = new Scene()
  protected renderer = new WebGLRenderer()

  // protected camera = new PerspectiveCamera(
  //   45,
  //   window.innerWidth / window.innerHeight,
  //   0.01,
  //   1000
  // )
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
  // protected reflectionVolumes = new ProbeVolumeGroup()

  private _refreshClosure = () => this.refresh()
  probeDebug: Mesh
  cubemapTextures: CubeTexture[] = []
  refPlane: Plane
  rayCaster: Raycaster
  debugObject: Mesh<SphereGeometry, ShaderMaterial>
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

    const probeMeshGroup = new ProbeMeshGroup(this.probes)

    this.scene.add(probeMeshGroup)

    const mat = new ShaderMaterial({
      uniforms: {
        map0: { value: null },
        map1: { value: null },
        map2: { value: null },
        map3: { value: null },
        map4: { value: null },
        map5: { value: null },
        map6: { value: null },
        map7: { value: null },
        map8: { value: null },
        map9: { value: null },
        map10: { value: null },
        map11: { value: null },
        map12: { value: null },
        map13: { value: null },
        map14: { value: null },
        map15: { value: null },

        mapRatio: { value: new Float32Array(16) },
      },

      vertexShader: `

        uniform float mapRatio[16];
        uniform samplerCube map0;
        uniform samplerCube map1;
        uniform samplerCube map2;
        uniform samplerCube map3;
        uniform samplerCube map4;
        uniform samplerCube map5;
        uniform samplerCube map6;
        uniform samplerCube map7;
        uniform samplerCube map8;
        uniform samplerCube map9;
        uniform samplerCube map10;
        uniform samplerCube map11;
        uniform samplerCube map12;
        uniform samplerCube map13;
        uniform samplerCube map14;
        uniform samplerCube map15;

        // varying vec3 vNormal;
        varying vec3 vProbedColor;
    
        void main() {
          // vNormal = (normal).xyz;
          vProbedColor = 
            (texture(map0, normal) * mapRatio[0] +
            texture(map1, normal) * mapRatio[1] +
            texture(map2, normal) * mapRatio[2] +
            texture(map3, normal) * mapRatio[3] +
            texture(map4, normal) * mapRatio[4] +
            texture(map5, normal) * mapRatio[5] +
            texture(map6, normal) * mapRatio[6] +
            texture(map7, normal) * mapRatio[7] +
            texture(map8, normal) * mapRatio[8] +
            texture(map9, normal) * mapRatio[9] +
            texture(map10, normal) * mapRatio[10] +
            texture(map11, normal) * mapRatio[11] +
            texture(map12, normal) * mapRatio[12] +
            texture(map13, normal) * mapRatio[13] +
            texture(map14, normal) * mapRatio[14] +
            texture(map15, normal) * mapRatio[15]).rgb;

          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

          
        }
      `,
      fragmentShader: `
        

      

        // varying vec3 vNormal;
        varying vec3 vProbedColor;

    
        void main() {

          // gl_FragColor = vec4(mapRatio[0], mapRatio[0], mapRatio[0], 1.0);

          gl_FragColor = vec4(vProbedColor,1.0);
            
          
        }
      `,
    })

    this.debugObject = new Mesh(new SphereGeometry(2, 16, 16), mat)

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
    const foundProbes: ProbeRatio[] = []

    this.irradianceVolumes.getSuroundingProbes(
      this.debugObject.position,
      foundProbes
    )

    const ratios = new Float32Array(16)

    for (let i = 0; i < 16; i++) {
      ratios[i] = foundProbes[i] !== undefined ? foundProbes[i][1] : 0
      this.debugObject.material.uniforms[`map${i}`].value =
        foundProbes[i] !== undefined ? foundProbes[i][0].texture : null
    }

    this.debugObject.material.uniforms.mapRatio.value = ratios

    this.debugObject.material.needsUpdate = true

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
