import {
  BufferAttribute,
  BufferGeometry,
  CubeCamera,
  CubeTexture,
  DoubleSide,
  HalfFloatType,
  LinearFilter,
  LinearMipMapLinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  NoBlending,
  RGBAFormat,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLCubeRenderTarget,
  WebGLRenderTargetOptions,
  WebGLRenderer,
} from 'three'

class CubemapWrapperMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        #include <common>
        
        varying vec2 vUv;
        
        void main(){
          #include <begin_vertex>
          vUv = uv;

          
					#include <project_vertex>
        }

      `,
      fragmentShader: `
        #include <common>
        
        varying vec2 vUv;

        uniform sampler2D sourceTexture;


        void main(){
          gl_FragColor = texture2D(sourceTexture, vUv);
          // gl_FragColor = vec4(vUv,0.0,1.0);
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

const nbPointsFloatPerCube = 72
const nbUvsFloatPerCube = 48
const nbIndicesUintPerCube = 36

// 0,1,3,2

const cubePositionsRef = new Float32Array([
  // +X
  1, -1, 1, 1, -1, -1, 1, 1, 1, 1, 1, -1,
  // -X
  -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1,
  // +Y
  -1, 1, 1, 1, 1, 1, -1, 1, -1, 1, 1, -1,
  // +Y
  -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1,
  // -Z
  -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1,
  // +Z
  1, -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1,
])

const cubeIndicesRef = new Uint16Array([
  // +X
  0, 1, 2, 2, 1, 3,
  // -X
  4, 5, 6, 6, 5, 7,
  // +Y
  8, 9, 10, 10, 9, 11,
  // -Y
  12, 13, 14, 14, 13, 15,
  // +Z
  16, 17, 18, 18, 17, 19,
  // -Z
  20, 21, 22, 22, 21, 23,
])

function cubePositions(
  outOffset = 0,
  out = new Float32Array(nbPointsFloatPerCube + outOffset)
) {
  cubePositionsRef.forEach((v, i) => {
    out[i + outOffset] = v
  })
  return out
}

function cubeIndices(
  pointIndex = 0,
  outOffset = 0,
  out = new Uint16Array(nbIndicesUintPerCube + outOffset)
): Uint16Array {
  cubeIndicesRef.forEach((v, i) => (out[i + outOffset] = v + pointIndex))
  return out
}

function layoutsToUvs(
  layouts: CubemapWrapperLayout,
  outOffset = 0,
  out = new Float32Array(layouts.coords.length * 8 + outOffset),
  needsToMatchCubeSize = false
): Float32Array {
  if (needsToMatchCubeSize && layouts.coords.length % 6) {
    throw new Error(
      'layoutsToUvs: layouts.coords.length must be a multiple of 6'
    )
  }

  // const uvs = new Float32Array(layouts.coords.length * 8)
  let uvIndex = outOffset
  for (let coord of layouts.coords) {
    const left = coord.x
    const bottom = 1 - coord.y
    const right = left + layouts.size.x
    const top = 1 - coord.y - layouts.size.y

    out[uvIndex + 0] = left
    out[uvIndex + 1] = top
    out[uvIndex + 2] = right
    out[uvIndex + 3] = top
    out[uvIndex + 4] = left
    out[uvIndex + 5] = bottom
    out[uvIndex + 6] = right
    out[uvIndex + 7] = bottom

    // 8 uvs float per face
    uvIndex += 8
  }

  return out
}

function createCubeWrapperGeom(layouts: CubemapWrapperLayout): BufferGeometry {
  const geom = new BufferGeometry()

  const positions = cubePositions()
  const uvs = layoutsToUvs(layouts)
  const indices = cubeIndices()
  geom.setAttribute('position', new BufferAttribute(positions, 3))
  geom.setAttribute('uv', new BufferAttribute(uvs, 2))
  geom.setIndex(new BufferAttribute(indices, 1))

  // geom.drawRange.count = 36

  return geom
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

export function getCubemapPackLayout(
  cubemapSize: number,
  nbCubemap = 1,
  maxTextureSize = 1024,
  nbFaceX = 4,
  nbFaceY = 2
) {
  const cluster_width = cubemapSize * nbFaceX
  const cluster_height = cubemapSize * nbFaceY

  const nb_cluster_x = Math.min(
    Math.floor(maxTextureSize / cluster_width),
    nbCubemap
  )
  const nb_cluster_y = Math.ceil(nbCubemap / nb_cluster_x)

  const texture_width = nb_cluster_x * cluster_width
  const texture_height = nb_cluster_y * cluster_height

  return [
    texture_width,
    texture_height,
    nb_cluster_x,
    nb_cluster_y,
    cluster_width,
    cluster_height,
  ]
}

export class CubemapWrapper {
  // private _renderTarget: WebGLCubeRenderTarget
  private _material = new CubemapWrapperMaterial()

  constructor(
    readonly renderer: WebGLRenderer,
    readonly renderTargetOptions: WebGLRenderTargetOptions = {}
  ) {}

  static gridLayout(
    sourceTextureWidth: number,
    sourceTextureHeight: number,
    cubemapFaceSize: number,
    nbCubes = 1,
    nbFacesPerRow = -1
  ): CubemapWrapperLayout[] {
    const layouts: CubemapWrapperLayout[] = []

    nbFacesPerRow =
      nbFacesPerRow === -1
        ? Math.floor(sourceTextureWidth / cubemapFaceSize)
        : nbFacesPerRow

    const uvWidth = cubemapFaceSize / sourceTextureWidth
    const uvHeight = cubemapFaceSize / sourceTextureHeight

    for (let cubeIndex = 0; cubeIndex < nbCubes; cubeIndex++) {
      const face0 = cubeIndex * 6

      const layout: CubemapWrapperLayout = {
        coords: [],
        size: new Vector2(uvWidth, uvHeight),
      }

      for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        const face = face0 + faceIndex
        const faceX = face % nbFacesPerRow
        const faceY = Math.floor(face / nbFacesPerRow)

        layout.coords.push(new Vector2(faceX * uvWidth, faceY * uvHeight))

       
      }

      layouts.push(layout)
    }
    return layouts
  }

  static lodLayout(cubemapSize: number, nbLevels = 1): CubemapWrapperLayout[] {
    const res: CubemapWrapperLayout[] = []
    const nbFacesPerRow = 4

    const sourceTextureWidth = cubemapSize * nbFacesPerRow
    const sourceTextureHeight = cubemapSize * 2

    let faceXOffset = 0
    let faceYOffset = 0

    for (let level = 0; level < nbLevels; level++) {
      const faceWidth = cubemapSize / Math.pow(2, level)
      const faceHeight = cubemapSize / Math.pow(2, level)

      const uvWidth = faceWidth / sourceTextureWidth
      const uvHeight = faceHeight / sourceTextureHeight

      const layout: CubemapWrapperLayout = {
        coords: [],
        size: new Vector2(uvWidth, uvHeight),
      }

      for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        const faceX = faceIndex % nbFacesPerRow
        const faceY = Math.floor(faceIndex / nbFacesPerRow)

        layout.coords.push(
          new Vector2(
            faceX * uvWidth + faceXOffset,
            faceY * uvHeight + faceYOffset
          )
        )
      }

      faceXOffset += (2 * faceWidth) / sourceTextureWidth
      faceYOffset += faceHeight / sourceTextureHeight

      res.push(layout)
    }

    return res
  }

  wrapCubeCollectionFromTexture(
    source: Texture,
    cubeMapSize: number,
    cubeLayouts: CubemapWrapperLayout[]
  ): CubeTexture[] {
    this._material.uniforms.sourceTexture.value = source

    const cubeTextures: CubeTexture[] = []

    const camera = new CubeCamera(1, 50, null)
    const mesh = new Mesh(undefined, this._material)

    for (let lod = 0; lod < cubeLayouts.length; lod++) {
      const renderTarget = new WebGLCubeRenderTarget(cubeMapSize, {
        format: source.format,
        type: source.type,
        colorSpace: source.colorSpace,
        ...this.renderTargetOptions,
        generateMipmaps: false,
        depthBuffer: false,
      })

      const layout = cubeLayouts[lod]


      const geom = createCubeWrapperGeom(layout)

      mesh.geometry = geom
      camera.renderTarget = renderTarget

      camera.update(this.renderer, mesh as any)

      geom.dispose()

      cubeTextures.push(renderTarget.texture)
    }

    return cubeTextures
  }

  wrapCubeLodFromTexture(
    source: Texture,
    cubeMapSize: number,
    lodLayouts: CubemapWrapperLayout[]
  ) {
    this._material.uniforms.sourceTexture.value = source

    const renderTarget = new WebGLCubeRenderTarget(cubeMapSize, {
      format: source.format,
      type: source.type,
      colorSpace: source.colorSpace,

      ...this.renderTargetOptions,

      magFilter: LinearFilter,
      minFilter: LinearMipMapLinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
    })

    const camera = new CubeCamera(1, 50, renderTarget)
    const mesh = new Mesh(undefined, this._material)

    const mipLevels = Math.log(cubeMapSize) * Math.LOG2E + 1.0
    const mipmapCount = Math.floor(
      Math.log2(Math.max(cubeMapSize, cubeMapSize))
    )

    for (let mip = 0; mip < mipLevels; mip++) {
      renderTarget.texture.mipmaps.push({})
    }

    let geom: BufferGeometry

    for (let lod = 0; lod < mipmapCount; lod++) {
      if (lod < lodLayouts.length) {
        const layout = lodLayouts[lod]
        geom = createCubeWrapperGeom(layout)
        mesh.geometry = geom
      }

      renderTarget.viewport.set(
        0,
        0,
        renderTarget.width >> lod,
        renderTarget.height >> lod
      )
      camera.activeMipmapLevel = lod
      camera.update(this.renderer, mesh as any)

      geom.dispose()
    }

    return renderTarget.texture
  }
}
