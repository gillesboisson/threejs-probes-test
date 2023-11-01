import {
  IUniform,
  Material,
  MaterialParameters,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
  Shader,
  WebGLRenderer,
} from 'three'
import { replaceShaderSourceIncludes, shaderReplaceInclude } from './utils'
import {
  ExtendedMaterialExtension,
  ExtendedMaterialOptions,
  ExtendedMaterialShaderDefinition,
  extendMaterial,
} from './extendMaterial'
import {
  probesMaterialFragmentShaderChunk,
  probesMaterialVertexShaderChunk,
} from './shaderShunk'
import { defines } from './shaderConstants'

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
): { new (params?: Partial<MaterialParamsT>): MaterialT } {
  return class ExtendedMaterial extends SuperMaterial {
    protected uniforms: Record<string, IUniform>

    constructor(params: Partial<MaterialParamsT> = {}) {
      super()

      if (shaderDefinition?.defines) {
        this.defines = {
          ...defines,
          ...shaderDefinition.defines,
        }
      }

      if (shaderDefinition?.uniforms) {
        this.uniforms = {
          ...shaderDefinition.uniforms,
        }
      }

      this.setValues({
        ...defaultParams,
        ...params,
      })
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
      super.onBeforeCompile(shader, renderer)

      shader.uniforms = {
        ...shader.uniforms,
        ...this.uniforms,
      }

      shader.vertexShader = shaderDefinition?.vertexShader
        ? shaderDefinition.vertexShader(shader.vertexShader)
        : replaceShaderSourceIncludes(
            shader.vertexShader,
            probesMaterialVertexShaderChunk
          )

      shader.fragmentShader = shaderDefinition?.fragmentShader
        ? shaderDefinition.fragmentShader(shader.fragmentShader)
        : replaceShaderSourceIncludes(
            shader.fragmentShader,
            probesMaterialFragmentShaderChunk
          )
      
      // defines hidden from spec
      ;(shader as any).defines = {
        ...(shader as any).defines,
        ...defines,
      }

      console.log('shader', shader)
    }
  } as any
}

export class MeshProbeStandardMaterial extends extendProbesMaterial<MeshStandardMaterial>(
  MeshStandardMaterial
) {
  wesh: string
  name = 'MeshProbeStandardMaterial'
}
