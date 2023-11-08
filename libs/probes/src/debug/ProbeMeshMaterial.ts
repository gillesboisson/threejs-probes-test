import { ShaderMaterial, CubeTexture } from 'three';


export class ProbeMeshMaterial extends ShaderMaterial {
  protected _envMap: CubeTexture;

  get envMap(): CubeTexture {
    return this._envMap;
  }

  set envMap(val: CubeTexture) {
    if (val !== this._envMap) {
      this._envMap = val;
      this.uniforms.envMap.value = val;
      this.needsUpdate = true;
      this.envMapUpdated();
    }
  }

  envMapUpdated() { }
}
