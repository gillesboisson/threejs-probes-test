import { ProbeMeshMaterial } from './ProbeMeshMaterial';


export class ReflectionProbeMeshMaterial extends ProbeMeshMaterial {
  // protected uRoughnessLod: number = 0
  protected _roughness = 0;
  protected _minRoughness = 0;
  protected _maxRoughness = 1;

  envMapUpdated() {
    this.uniforms.uRoughnessLevel.value[3] = this.envMap.mipmaps.length + 1;
    console.log(
      'this.uniforms.uRoughnessLevel[3]',
      this.uniforms.uRoughnessLevel[3]
    );
    this.needsUpdate = true;
  }

  updateRoughnessLod() {
    this.uniforms.uRoughnessLod.value = Math.min(
      Math.max(
        this.roughness / (this.maxRoughness - this.minRoughness) -
        this.minRoughness,
        0
      ),
      1
    );
    this.needsUpdate = true;
  }

  get roughness(): number {
    return this._roughness;
  }

  set roughness(val: number) {
    if (val !== this._roughness) {
      this._roughness = val;
      this.updateRoughnessLod();
    }
  }

  get minRoughness(): number {
    return this._minRoughness;
  }

  set minRoughness(val: number) {
    if (val !== this._minRoughness) {
      this._minRoughness = val;
      this.updateRoughnessLod();
    }
  }

  get maxRoughness(): number {
    return this._maxRoughness;
  }

  set maxRoughness(val: number) {
    if (val !== this._maxRoughness) {
      this._maxRoughness = val;
      this.updateRoughnessLod();
    }
  }

  constructor() {
    super({
      uniforms: {
        envMap: { value: null },
        uRoughnessLod: { value: 0 },
        uRoughnessLevel: { value: [0.33, 0, 1, 1] },
      },

      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
    
        void main() {
          vNormal = ( normal).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          vPosition = position;
        }
      `,
      fragmentShader: `
        uniform samplerCube envMap;
        uniform float uRoughnessLod;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
    
        void main() {
          
          vec3 viewDir = normalize(vPosition - cameraPosition);
          vec3 normal = normalize(vNormal);
          // envMap reflection vector
          vec3 reflexion = reflect(viewDir, normal);

          // normalize rougness in texture roughness space
          


          // gl_FragColor = vec4(vNormal / 2.0 + 0.5, 1.0);
          // gl_FragColor = vec4(1.0,0.0,0.0,1.0);
          gl_FragColor = textureCubeLodEXT(envMap, reflexion,uRoughnessLod);
          
        }
      `,
    });
  }
}
