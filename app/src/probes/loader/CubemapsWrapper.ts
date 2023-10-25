import {
  Box2,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CubeCamera,
  CubeTexture,
  DoubleSide,
  FramebufferTexture,
  Mesh,
  NoBlending,
  OrthographicCamera,
  RawShaderMaterial,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLCubeRenderTarget,
  WebGLRenderTargetOptions,
  WebGLRenderer,
} from 'three'

class CubemapWrapperMaterial extends RawShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        precision highp float;

        attribute vec2 uv;
        attribute vec3 position;

        varying vec2 vUv;

        void main(){
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }

      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D sourceTexture;

        varying vec2 vUv;

        void main(){
          gl_FragColor = texture2D(sourceTexture, vUv);
        }
      
      `,
      uniforms: {
        sourceTexture: { value: null },
      },
      depthTest: false,
      side: DoubleSide,
      blending: NoBlending,
    })
  }
}

export type CubemapWrapperLayout = { coords: Vector2[]; size: Vector2 }

// box square size
const sqs = 1 / 4

// cubemap dice layout representation as min max uvs
export const DiceWrapperLayout: CubemapWrapperLayout = {
  coords: [
    new Vector2(0, sqs),
    new Vector2(2 * sqs, sqs),
    new Vector2(sqs, 2 * sqs),
    new Vector2(sqs, 0),
    new Vector2(sqs, sqs),
    new Vector2(3 * sqs, sqs),
  ],
  size: new Vector2(sqs, sqs),
}




export class CubemapWrapper {
  // private _renderTarget: WebGLCubeRenderTarget
  private _camera: OrthographicCamera
  private _material = new CubemapWrapperMaterial()

  constructor(
    readonly renderer: WebGLRenderer,
    readonly renderTargetOptions: WebGLRenderTargetOptions = {}
  ) {
    this._camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this._camera.position.z = 1;
    // this._renderTarget = new WebGLCubeRenderTarget()
  }

  protected wrapperLayoutToUvs(layout: CubemapWrapperLayout): Float32Array {
    const { coords, size } = layout

    const uvs = new Float32Array(coords.length * 8)

    for (let i = 0; i < coords.length; i++) {
      const uvIndex = i * 8
      const left = coords[i].x
      const top = 1 - coords[i].y
      const right = left + size.x
      const bottom = 1 - coords[i].y - size.y

      uvs[uvIndex + 0] = left
      uvs[uvIndex + 1] = top
      uvs[uvIndex + 2] = right
      uvs[uvIndex + 3] = top
      uvs[uvIndex + 4] = left
      uvs[uvIndex + 5] = bottom
      uvs[uvIndex + 6] = right
      uvs[uvIndex + 7] = bottom
    }

    return uvs
  }

  protected generateQuadPositions(layout: CubemapWrapperLayout): Float32Array {
    const { coords, size } = layout

    const positions = new Float32Array(coords.length * 12)
    const left = -1
    const top = -1
    const right = 1
    const bottom = 1

    for (let i = 0; i < coords.length; i++) {
      const positionIndex = i * 12

      positions[positionIndex + 0] = left
      positions[positionIndex + 1] = top
      positions[positionIndex + 2] = 0
      positions[positionIndex + 3] = right
      positions[positionIndex + 4] = top
      positions[positionIndex + 5] = 0
      positions[positionIndex + 6] = left
      positions[positionIndex + 7] = bottom
      positions[positionIndex + 8] = 0
      positions[positionIndex + 9] = right
      positions[positionIndex + 10] = bottom
      positions[positionIndex + 11] = 0
    }

    return positions
  }

  protected generateQuadIndices(layout: CubemapWrapperLayout): Uint16Array {
    

    const indices = new Uint16Array(layout.coords.length * 6)

    for (let i = 0; i < layout.coords.length; i++) {
      const index = i * 6
      const vertexIndex = i * 4

      indices[index + 0] = vertexIndex + 0
      indices[index + 1] = vertexIndex + 1
      indices[index + 2] = vertexIndex + 2
      indices[index + 3] = vertexIndex + 2
      indices[index + 4] = vertexIndex + 1
      indices[index + 5] = vertexIndex + 3
    }

    return indices
  }

  protected createGeometry(layout: CubemapWrapperLayout): BufferGeometry {
    const nbFaces = layout.coords.length
    const nbPoints = nbFaces * 4

    const uvData = this.wrapperLayoutToUvs(layout)
    const uvAttribute = new BufferAttribute(uvData, 2)
    const positionAttribute = new BufferAttribute(
      this.generateQuadPositions(layout),
      3
    )

    const indicesAttribute = new BufferAttribute(
      this.generateQuadIndices(layout),
      1,
    )

    const geometry = new BufferGeometry()

    geometry.setAttribute('uv', uvAttribute)
    geometry.setAttribute('position', positionAttribute)
    geometry.setIndex(indicesAttribute)
    
    geometry.drawRange.count = 6;
    

    return geometry
  }

  wrapFromTexture(
    source: Texture,
    size: number,
    layout: CubemapWrapperLayout
  ) {
    this._material.uniforms.sourceTexture.value = source
    this._material.needsUpdate = true

    const renderTarget = new WebGLCubeRenderTarget(size, {
      format: source.format,
      type: source.type,
      generateMipmaps: false,
      
      ...this.renderTargetOptions,
      depthBuffer: false,
    })

    // renderTarget.texture = target
    renderTarget.viewport.set(0, 0, size, size)

    const geometry = this.createGeometry(layout)
    const mesh = new Mesh(geometry, this._material)
    const oldRenderTarget = this.renderer.getRenderTarget()
    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
      geometry.drawRange.start = faceIndex * 6;
      this.renderer.setRenderTarget(renderTarget, faceIndex)
      this.renderer.render(mesh, this._camera)
    }

    this.renderer.setRenderTarget(oldRenderTarget)
    geometry.dispose()
    // renderTarget.dispose()

    return renderTarget.texture;

  }
}
