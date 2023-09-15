import {
  Material,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  ShaderMaterialParameters,
  Texture,
  UniformsGroup,
} from 'three'



const postProcessVertexShader = require('./shaders/post-process.vert').default

export class PostProcessMaterial extends RawShaderMaterial {
  // missing declaration on @types/three
  public uniformsGroups: UniformsGroup[];
  
  constructor(params: ShaderMaterialParameters) {
    if (params.vertexShader === undefined) {
      params.vertexShader = postProcessVertexShader
    }

    if (params.blending === undefined) {
      params.blending = NoBlending
    }


    super(params)
  }
}

export class PostProcess<MatT extends Material = Material> {
  protected plane: PlaneGeometry

  readonly scene: Scene
  readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private _postQuad: Mesh<PlaneGeometry, Material>



  protected _material?: MatT
  constructor(material?: MatT) {
    const plane = new PlaneGeometry(2, 2)

    this._postQuad = new Mesh(plane);

    // (this._postQuad.material as any).uniform
    this.scene = new Scene()
    this.scene.add(this._postQuad)
    if (material !== undefined) {
      this.material = material
    }
  }

  protected get material(): MatT {
    return this._material
  }

  protected set material(val: MatT) {
    if (val !== this._material) {
      this._material = val
      this._postQuad.material = val
    }
  }

  public getMaterial(): MatT {
    return this._material
  }
}

export interface HasDiffuseMap {
  diffuseMap: Texture
}

export type MPPostProcess = PostProcess<Material & HasDiffuseMap>
