import {
  BufferGeometry,
  Camera,
  IUniform,
  Material,
  MaterialParameters,
  Object3D,
  Scene,
  Shader,
  WebGLRenderer,
  UniformsUtils,
} from 'three'
import { replaceShaderSourceIncludes } from './utils'
import {
  probesMaterialFragmentChunksOverride,
  probesMaterialVertexChunksOverride,
} from './shaderShunk'
import {
  defines,
  irradianceMapNames,
  maxIrradianceMaps,
  maxReflectionMaps,
  // materialUniforms,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from './shaderConstants'
import { ProbeVolumeHandler } from '../ProbeVolumeHandler'
import { ProbeRatio, ProbeRatioLod } from '../type'
import {
  IrradianceProbeVolume,
  ProbeVolumeRatio,
  ReflectionProbeVolume,
} from '../volume'

const irradianceRatioVarname = ratioVar('irradiance')
const reflectionRatioVarname = ratioVar('reflection')
const reflectionLodVarname = reflectionLodVar()

export function extendProbesMaterial<
  MaterialT extends Material = Material,
  MaterialParamsT extends MaterialParameters = MaterialParameters
>(
  SuperMaterial: typeof Material,
  defaultParams: Partial<MaterialParamsT> = {},
  shaderDefinition?: {
    vertexShader?: (shader: string) => string
    fragmentShader?: (shader: string) => string
    uniforms?: Record<string, IUniform>
    defines?: Record<string, any>
  }
): {
  new (
    probeVolumeHander: ProbeVolumeHandler,
    params?: Partial<MaterialParamsT>
  ): MaterialT
} {
  return class ExtendedProbeMaterial extends SuperMaterial {
    protected uniforms: Record<string, IUniform>

    private _irradianceProbeRatio: ProbeRatio[] = []
    private _reflectionProbeRatio: ProbeRatioLod[] = []

    private _irradianceGlobalProbeRatio: ProbeVolumeRatio<IrradianceProbeVolume>[] =
      []
    private _reflectionGlobalProbeRatio: ProbeVolumeRatio<ReflectionProbeVolume>[] =
      []

    protected _probesIntensity: number = 1

    get probesIntensity(): number {
      return this._probesIntensity
    }

    set probesIntensity(value: number) {
      this._probesIntensity = value
    }

    constructor(
      readonly probeVolumeHander: ProbeVolumeHandler,
      params: Partial<MaterialParamsT> = {}
    ) {
      super()

      if (shaderDefinition?.defines) {
        this.defines = {
          ...defines,
          ...shaderDefinition.defines,
        }
      }

      const uniforms: Record<string, IUniform> = shaderDefinition?.uniforms
        ? UniformsUtils.clone(shaderDefinition.uniforms)
        : {}

      irradianceMapNames.map((name) => {
        const uniform: IUniform = { value: null }
        uniforms[name] = uniform
      })

      reflectionMapNames.map((name) => {
        const uniform: IUniform = { value: null }
        uniforms[name] = uniform
      })

      uniforms[irradianceRatioVarname] = {
        value: new Float32Array(maxIrradianceMaps),
      }

      uniforms[reflectionLodVarname] = {
        value: new Float32Array(maxReflectionMaps),
      }

      uniforms[reflectionRatioVarname] = {
        value: new Float32Array(maxReflectionMaps),
      }

      uniforms.probesIntensity = { value: this._probesIntensity }

      this.uniforms = UniformsUtils.clone(uniforms)
      // debugger
      this.setValues({
        ...defaultParams,
        ...params,
        // uniforms,
      })
    }

    onBeforeRender(
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      geometry: BufferGeometry,
      object: Object3D,
      group: Object3D
    ) {
      // console.log('object',object);
      const uniforms = this.uniforms

      const irradianceProbeRatio = this._irradianceProbeRatio
      const reflectionProbeRatio = this._reflectionProbeRatio

      const irradianceRatioBufferData = uniforms[irradianceRatioVarname].value as Float32Array
      const reflectionRatioBufferData = uniforms[reflectionRatioVarname].value as Float32Array
      const reflectionLodBufferData = uniforms[reflectionLodVarname].value as Float32Array
      
      this.probeVolumeHander.irradianceVolumes.getSuroundingProbes(
        object.position,
        irradianceProbeRatio,
        this._irradianceGlobalProbeRatio
      )
      this.probeVolumeHander.reflectionVolumes.getSuroundingProbes(
        object.position,
        reflectionProbeRatio,
        this._reflectionGlobalProbeRatio,
        (this as any).roughness
      )

      for (let i = 0; i < irradianceRatioBufferData.length; i++) {
        if (i < irradianceProbeRatio.length) {
          irradianceRatioBufferData[i] = irradianceProbeRatio[i][1]
          uniforms[irradianceMapNames[i]].value =
            irradianceProbeRatio[i][0].texture
        } else {
          irradianceRatioBufferData[i] = 0
          uniforms[irradianceMapNames[i]].value = null
        }
      }

      for (let i = 0; i < reflectionRatioBufferData.length; i++) {
        if (i < reflectionProbeRatio.length) {
          reflectionRatioBufferData[i] = reflectionProbeRatio[i][1]
          reflectionLodBufferData[i] = reflectionProbeRatio[i][2]
          uniforms[reflectionMapNames[i]].value =
            reflectionProbeRatio[i][0].texture
          // ;(reflectionTextureUniforms[i] as any).needsUpdate = true
        } else {
          reflectionRatioBufferData[i] = 0
          reflectionLodBufferData[i] = 0
          uniforms[reflectionMapNames[i]].value = null
        }
      }

      this.uniforms.probesIntensity.value = this._probesIntensity
      this.needsUpdate = true
    }

    customProgramCacheKey(): string {
      return this.name
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
      console.log("-> onBeforeCompile");
      super.onBeforeCompile(shader, renderer)
      
      for (let key in this.uniforms) {
        shader.uniforms[key] = this.uniforms[key]
      }

      this.uniforms = shader.uniforms

      shader.vertexShader = shaderDefinition?.vertexShader
        ? shaderDefinition.vertexShader(shader.vertexShader)
        : replaceShaderSourceIncludes(
            shader.vertexShader,
            probesMaterialVertexChunksOverride
          )

      shader.fragmentShader = shaderDefinition?.fragmentShader
        ? shaderDefinition.fragmentShader(shader.fragmentShader)
        : replaceShaderSourceIncludes(
            shader.fragmentShader,
            probesMaterialFragmentChunksOverride
          )
      ;(shader as any).defines = {
        ...(shader as any).defines,
        ...defines,
      }
    }
  } as any
}
