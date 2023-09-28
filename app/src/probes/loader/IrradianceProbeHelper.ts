import {
  Box3,
  BufferGeometry,
  CubeTexture,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { IrradianceVolumeDefinition } from '../type'
import { generateProbeGridPositions } from './generateProbeGridPositions'
import { generateProbeGridCubemaps } from './generateProbeGridCubemaps'

// const ProbeDebugMaterialParams = {
//   uniforms: {
//     envMap: { value: null, type: 't' },
//   },

//   vertexShader: `
//     varying vec3 vNormal;

//     void main() {
//       vNormal = ( normal).xyz;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//     }
//   `,
//   fragmentShader: `
//     uniform samplerCube envMap;
//     varying vec3 vWorldPosition;
//     varying vec3 vNormal;

//     void main() {
//       // gl_FragColor = vec4(vNormal / 2.0 + 0.5, 1.0);
//       // gl_FragColor = vec4(1.0,0.0,0.0,1.0);
//       gl_FragColor = textureCube(envMap, vNormal);
      
//     }
//   `,
// }

// export class ProbeDebugMaterial extends ShaderMaterial {
//   private _envMap: CubeTexture

//   get envMap(): CubeTexture {
//     return this._envMap
//   }

//   set envMap(val: CubeTexture) {
//     if (val !== this._envMap) {
//       this._envMap = val
//       this.uniforms.envMap.value = val
//       this.needsUpdate = true
//     }
//   }

//   constructor() {
//     super({
//       uniforms: {
//         envMap: { value: null },
//       },

//       vertexShader: `
//         varying vec3 vNormal;
    
//         void main() {
//           vNormal = ( normal).xyz;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//         }
//       `,
//       fragmentShader: `
//         uniform samplerCube envMap;
//         varying vec3 vWorldPosition;
//         varying vec3 vNormal;
    
//         void main() {
//           // gl_FragColor = vec4(vNormal / 2.0 + 0.5, 1.0);
//           // gl_FragColor = vec4(1.0,0.0,0.0,1.0);
//           gl_FragColor = textureCube(envMap, vNormal);
          
//         }
//       `,
//     })
//   }
// }





// export class IrradianceProbeHelper extends Group {
//   positions: Vector3[]
//   meshes: Mesh<BufferGeometry, ProbeDebugMaterial>[] = []
//   textures: CubeTexture[]
//   // dummy: Object3D;
//   constructor(readonly data: IrradianceVolumeDefinition) {
//     super()
//     // this.dummy = new Object3D();

//     const [positionX, positionZ, positionY] = data.position

//     this.position.set(positionX, positionY, positionZ)
//     this.positions = generateProbeGridPositions(data)
//     // this.instanceMatrix.setUsage(DynamicDrawUsage)

//     this.computeInstances()
//   }

//   computeInstances() {
//     const nbInstances = this.positions.length
//     const geom = new SphereGeometry(0.5, 16, 16)

//     for (let i = 0; i < nbInstances; i++) {
//       const position = this.positions[i]
//       const material = new ProbeDebugMaterial()
//       const mesh = new Mesh(geom, material)
//       mesh.position.copy(position)
//       this.add(mesh)
//       this.meshes.push(mesh)
//     }
//   }

//   loadTexture(image: HTMLImageElement) {
//     this.textures = generateProbeGridCubemaps(this.data, image)

//     for (let i = 0; i < this.meshes.length; i++) {
//       const mesh = this.meshes[i]
//       const texture = this.textures[i]

//       console.log('texture', texture)
//       mesh.material.envMap = texture
//       mesh.material.needsUpdate = true
//     }

//     return this.textures
//   }
// }
// export class IrradianceProbeInstanceHelper extends InstancedMesh {
//   positions: Vector3[]
//   dummy: Object3D
//   constructor(readonly data: IrradianceVolumeDefinition) {
//     const material = new MeshBasicMaterial({ color: 16777215, wireframe: true })
//     const geom = new SphereGeometry(0.5, 8, 8)
//     super(
//       geom,
//       material,
//       data.data.resolution[0] *
//         data.data.resolution[1] *
//         data.data.resolution[2]
//     )
//     this.dummy = new Object3D()

//     const [positionX, positionZ, positionY] = data.position

//     this.position.set(positionX, positionY, positionZ)
//     this.positions = generateProbeGridPositions(data)
//     // this.instanceMatrix.setUsage(DynamicDrawUsage)
//     this.computeInstances()
//   }

//   computeInstances() {
//     const nbInstances = this.positions.length

//     for (let i = 0; i < nbInstances; i++) {
//       const position = this.positions[i]
//       this.dummy.position.copy(position)
//       this.dummy.updateMatrix()
//       this.setMatrixAt(i, this.dummy.matrix)
//     }

//     this.instanceMatrix.needsUpdate = true
//   }

//   loadTexture(image: HTMLImageElement) {
//     return generateProbeGridCubemaps(this.data, image)
//   }
// }
