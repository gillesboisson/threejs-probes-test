import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  RawShaderMaterial,
  ShaderMaterial,
  Texture,
  Vector2,
} from 'three'

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import { fragmentShader, vertexShader } from './denoise.glsl'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

export class DenoiserMaterial extends RawShaderMaterial {
  constructor() {
    super({
      depthTest: false,
      depthWrite: false,
      glslVersion: '300 es',
      uniforms: {
        imageData: {
          value: null,
        },
        uSigma: {
          value: 7.0,
        },
        uKSigma: {
          value: 3.0,
        },
        uThreshold: {
          value: 0.195,
        },
        // invGamma: {
        //   value: 0.4545,
        // },
        whichTest: {
          value: 0.0,
        },
        wSize: {
          value: new Vector2(0.0, 0.0),
        },
      },

      vertexShader,
      fragmentShader,
    })
  }

  set texture(texture: Texture) {
    this.uniforms.imageData.value = texture

    if (!texture.image) {
      throw new Error('texture.image is null')
    }

    this.uniforms.wSize.value = new Vector2(
      texture.image.width,
      texture.image.height
    )
  }

  get texture(): Texture {
    return this.uniforms.imageData.value
  }

  // generate uniforms accessors

  // get imageData(): Texture {
  //   return this.uniforms.imageData.value
  // }

  // set imageData(value: Texture) {
  //   this.uniforms.imageData.value = value
  // }

  get uSigma(): number {
    return this.uniforms.uSigma.value
  }

  set uSigma(value: number) {
    this.uniforms.uSigma.value = value
  }

  get uKSigma(): number {
    return this.uniforms.uKSigma.value
  }

  set uKSigma(value: number) {
    this.uniforms.uKSigma.value = value
  }

  get uThreshold(): number {
    return this.uniforms.uThreshold.value
  }

  set uThreshold(value: number) {
    this.uniforms.uThreshold.value = value
  }

  get invGamma(): number {
    return this.uniforms.invGamma.value
  }

  set invGamma(value: number) {
    this.uniforms.invGamma.value = value
  }

  // get whichTest(): number {
  //   return this.uniforms.whichTest.value
  // }

  // set whichTest(value: number) {
  //   this.uniforms.whichTest.value = value
  // }
}

export class DenoiserPass extends ShaderPass {

  material: DenoiserMaterial

  constructor(textureID?: string) {
    super(new DenoiserMaterial(), textureID)
  }

  get texture(): Texture {
    return this.material.texture
  }

  set texture(texture: Texture) {
    this.material.texture = texture
  }

  get uSigma(): number {
    return this.material.uSigma
  }

  set uSigma(value: number) {
    this.material.uSigma = value
  }

  get uKSigma(): number {
    return this.material.uKSigma
  }

  set uKSigma(value: number) {
    this.material.uKSigma = value
  }

  get uThreshold(): number {
    return this.material.uThreshold
  }

  set uThreshold(value: number) {
    this.material.uThreshold = value
  }

  get invGamma(): number {
    return this.material.invGamma
  }

  set invGamma(value: number) {
    this.material.invGamma = value
  }

  
}


// export class Denoiser extends EffectComposer{
//   constructor(texture: Texture) {
//     super()
//     const pass = new DenoiserPass()
//     pass.texture = texture
//     this.addPass(pass)
//   }
// }