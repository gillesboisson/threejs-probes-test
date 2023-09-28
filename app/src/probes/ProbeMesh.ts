import { SphereGeometry, ShaderMaterial, CubeTexture, Mesh, Group } from 'three'
import { Probe } from './Probe'

const probeMeshGeom = new SphereGeometry(0.5, 16, 16)

export class ProbeMeshMaterial extends ShaderMaterial {
  private _envMap: CubeTexture

  get envMap(): CubeTexture {
    return this._envMap
  }

  set envMap(val: CubeTexture) {
    if (val !== this._envMap) {
      this._envMap = val
      this.uniforms.envMap.value = val
      this.needsUpdate = true
    }
  }

  constructor() {
    super({
      uniforms: {
        envMap: { value: null },
      },

      vertexShader: `
        varying vec3 vNormal;
    
        void main() {
          vNormal = ( normal).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform samplerCube envMap;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
    
        void main() {
          // gl_FragColor = vec4(vNormal / 2.0 + 0.5, 1.0);
          // gl_FragColor = vec4(1.0,0.0,0.0,1.0);
          gl_FragColor = textureCube(envMap, vNormal);
          
        }
      `,
    })
  }
}

export class ProbeMesh extends Mesh<SphereGeometry> {
  constructor(readonly probe: Probe) {
    const mat = new ProbeMeshMaterial()
    mat.envMap = probe.texture
    super(probeMeshGeom, mat)

    this.position.copy(probe.position)
  }
}

export class ProbeMeshGroup extends Group {
  constructor(readonly probes: Probe[]) {
    super()
    probes.forEach((probe) => {
      this.add(new ProbeMesh(probe))
    })
  }
}
