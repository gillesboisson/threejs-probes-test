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
  UniformsGroup,
  MultiplyOperation,
  AddOperation,
  MixOperation,
  MeshLambertMaterial,
  CubeReflectionMapping,
  Vector3,
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
    protected uniformsGroups: UniformsGroup[] = []
    readonly isShaderMaterial = true
    protected uniformsNeedUpdate = false
    private _irradianceProbeRatio: ProbeRatio[] = []
    private _reflectionProbeRatio: ProbeRatioLod[] = []

    protected _combine: number = MultiplyOperation
    protected _probeMapMode: number = CubeReflectionMapping

    protected lastObject: Object3D | null = null
    protected lastObjectPosition = new Vector3()
    protected objectPosition = new Vector3()

    get probeMapMode(): number {
      return this._probeMapMode
    }

    set probeMapMode(value: number) {
      if (this._probeMapMode !== value) {
        this._probeMapMode = value
        this.needsUpdate = true
      }
    }

    get combine(): number {
      return this._combine
    }

    set combine(value: number) {
      if (this._combine !== value) {
        this._combine = value
        this.needsUpdate = true
      }
    }

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
      // super.onBeforeRender(renderer, scene, camera, geometry, object, group)
      // console.log('object',object);
      const uniforms = this.uniforms

      let objectUniformsNeedsUpdate = false
      this.objectPosition.setFromMatrixPosition(object.matrixWorld)

      const objectProbesNeedsUpdate =
        this.lastObject !== object ||
        !this.lastObjectPosition.equals(this.objectPosition)

      if (objectProbesNeedsUpdate) {
        this.lastObject = object
        this.lastObjectPosition.copy(object.position)
        const irradianceProbeRatio = this._irradianceProbeRatio
        const reflectionProbeRatio = this._reflectionProbeRatio

        const irradianceRatioBufferData = uniforms[irradianceRatioVarname]
          .value as Float32Array
        const reflectionRatioBufferData = uniforms[reflectionRatioVarname]
          .value as Float32Array
        const reflectionLodBufferData = uniforms[reflectionLodVarname]
          .value as Float32Array

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
          const ut = uniforms[irradianceMapNames[i]]

          if (i < irradianceProbeRatio.length) {
            if (
              irradianceRatioBufferData[i] !== irradianceProbeRatio[i][1] ||
              ut.value !== irradianceProbeRatio[i][0].texture
            ) {
              irradianceRatioBufferData[i] = irradianceProbeRatio[i][1]
              ut.value = irradianceProbeRatio[i][0].texture
              objectUniformsNeedsUpdate = true
            }
          } else {
            if (irradianceRatioBufferData[i] !== 0 || ut.value !== null) {
              objectUniformsNeedsUpdate = true
              irradianceRatioBufferData[i] = 0
              ut.value = null
            }
          }
        }

        for (let i = 0; i < reflectionRatioBufferData.length; i++) {
          if (i < reflectionProbeRatio.length) {
            if (
              reflectionRatioBufferData[i] !== reflectionProbeRatio[i][1] ||
              reflectionLodBufferData[i] !== reflectionProbeRatio[i][2] ||
              uniforms[reflectionMapNames[i]].value !==
                reflectionProbeRatio[i][0].texture
            ) {
              reflectionRatioBufferData[i] = reflectionProbeRatio[i][1]
              reflectionLodBufferData[i] = reflectionProbeRatio[i][2]
              uniforms[reflectionMapNames[i]].value =
                reflectionProbeRatio[i][0].texture
              objectUniformsNeedsUpdate = true
            }
          } else {
            if (
              reflectionRatioBufferData[i] !== 0 ||
              reflectionLodBufferData[i] !== 0 ||
              uniforms[reflectionMapNames[i]].value !== null
            ) {
              reflectionRatioBufferData[i] = 0
              reflectionLodBufferData[i] = 0
              uniforms[reflectionMapNames[i]].value = null
              objectUniformsNeedsUpdate = true
            }
          }
        }
      }

      if (
        (this as any).reflectivity !== undefined &&
        uniforms.reflectivity !== undefined
      ) {
        uniforms.reflectivity.value = (this as any).reflectivity
      }

      if ((this as any).ior !== undefined && uniforms.ior !== undefined) {
        uniforms.ior.value = (this as any).ior
      }

      if (
        (this as any).refractionRatio !== undefined &&
        uniforms.refractionRatio !== undefined
      ) {
        uniforms.refractionRatio.value = (this as any).refractionRatio
      }

      uniforms.probesIntensity.value = this._probesIntensity
      this.uniformsNeedUpdate = objectUniformsNeedsUpdate
    }

    customProgramCacheKey(): string {
      return 'probes,' + this._combine + ',' + this._probeMapMode
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
      console.log('-> onBeforeCompile')

      for (let key in this.uniforms) {
        if (shader.uniforms[key]) {
          shader.uniforms[key].value = this.uniforms[key].value
        } else {
          shader.uniforms[key] = this.uniforms[key]
        }
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

      // override probe operation for lambert, phong based material
      // in order to replicate envmap behaviour
      if (this._combine === MultiplyOperation) {
        ;(shader as any).defines.PROBE_BLENDING_MULTIPLY = true
      } else if (this._combine === AddOperation) {
        ;(shader as any).defines.PROBE_BLENDING_ADD = true
      } else if (this._combine === MixOperation) {
        ;(shader as any).defines.PROBE_BLENDING_MIX = true
      }

      if (this._probeMapMode === CubeReflectionMapping) {
        ;(shader as any).defines.PROBE_MODE_REFLECTION = true
      } else {
        ;(shader as any).defines.PROBE_MODE_REFRACTION = true
      }

      console.log(';(shader as any).defines', (shader as any).defines)
      super.onBeforeCompile(shader, renderer)
    }

    copy(material: this): this {
      super.copy(material)
      this._probesIntensity = material.probesIntensity !== undefined ? material.probesIntensity : 1

      return this
    }

    clone(): this {
      return new (this.constructor as any)(this.probeVolumeHander).copy(this)
    }

    toJSON(meta?: any) {
      const data = super.toJSON(meta)

      data.probesIntensity = this._probesIntensity

      return data
    }
  } as any
}
