import { IUniform, Material, MaterialParameters, Shader } from 'three'

// based on leoncvlt implementation : https://github.com/leoncvlt/three-extended-material/blob/master/src/ExtendedMaterial.js




export type ExtendedMaterialShaderDefinition = Shader & {
  // name: string
  defines: Record<string, any>
  shaderType: string
}

export type ShaderReplaceFunction = (
  shader: string,
  shaderType: string
) => string

export type ExtendedMaterialOptions = {
  debug: boolean
  programCacheKey: string
}

export type ExtendedMaterialExtension = {
  name: string
  uniforms: Record<string, IUniform>
  defines: Record<string, any>
  vertexShader: ShaderReplaceFunction
  fragmentShader: ShaderReplaceFunction
}

const defaultExtension: ExtendedMaterialExtension = {
  name: '',
  uniforms: {},
  defines: {},
  vertexShader: (shader) => shader,
  fragmentShader: (shader) => shader,
}

export function extendMaterial<
  MaterialT extends Material = Material,
  MaterialParamsT = MaterialParameters
>(
  SuperMaterial: typeof Material,
  extensions: Partial<ExtendedMaterialExtension>[] = [],
  properties: Partial<MaterialParamsT> = {},
  options: Partial<ExtendedMaterialOptions> = {
    debug: false,
    programCacheKey: null,
  }
): { new (props?: Partial<MaterialParamsT>): MaterialT } {
  return class _ExtendedMaterial extends SuperMaterial {
    public uniforms: Record<string, IUniform>
    public _id: string
    public _cacheKey: string

    constructor(props: Partial<MaterialParamsT> = {}) {
      super()

      if (!Array.isArray(extensions)) {
        extensions = [extensions]
      }

      // sanitize all extensions by adding empty fields if necessary
      extensions = extensions.map((extension) => ({
        ...defaultExtension,
        ...extension,
      }))


      this.uniforms = {}

      // hash the supermaterial name alongside with the extensions' ids
      // to generate a gl program cache key for this combination
      this._id =
        SuperMaterial.name + '_' + extensions.map((e) => e.name).join('_')
      this._cacheKey = '0'
      for (let i = 0; i < this._id.length; i++) {
        this._cacheKey = (
          (Math.imul(31, parseInt(this._cacheKey)) + this._id.charCodeAt(i)) |
          0
        ).toString()
      }

      // go through each extension's uniforms
      // and add getters and setters to the material
      extensions.forEach((extension) => {
        Object.entries(extension.uniforms).forEach(([uniform, value]) => {
          if (uniform in this.uniforms) {
            console.warn(
              `ExtendedMaterial: duplicated '${uniform}' uniform - shader compilation might fail.` +
                `To fix this, rename the ${uniform} uniform in the ${extension.name} extension.`
            )
          }
          this.uniforms[uniform] = { value: props[uniform] || value }
          if (uniform in this) {
            console.warn(
              `ExtendedMaterial: the material already contains a '${uniform}' property - ` +
                `getters and setters will not be set.` +
                `To fix this, rename the ${uniform} uniform in the ${extension.name} extension.`
            )
          } else {
            Object.defineProperty(this, uniform, {
              get() {
                return this.uniforms[uniform]?.value
              },
              set(newValue) {
                if (this.uniforms) {
                  this.uniforms[uniform].value = newValue
                }
              },
            })
          }
        })
      })

      // set the initial material properties passed to the method
      this.setValues({
        ...properties,
        ...props,
      })
    }

    onBeforeCompile(shader: ExtendedMaterialShaderDefinition) {
      extensions.forEach(
        (extension: ExtendedMaterialExtension, ind: number) => {
          
          Object.keys(extension.uniforms).forEach((uniform) => {
            shader.uniforms[uniform] = this.uniforms[uniform]
          })
          Object.entries(extension.defines).forEach(([define, value]) => {
            if (!shader.defines) {
              shader.defines = {}
            }
            shader.defines[define] = value
          })

          shader.vertexShader = extension.vertexShader(
            shader.vertexShader,
            shader.shaderType
          )
          shader.fragmentShader = extension.fragmentShader(
            shader.fragmentShader,
            shader.shaderType
          )
        }
      )

      if (options.debug) {
        console.debug(this._id, shader)
      }

      this.uniforms = shader.uniforms
      this.needsUpdate = true
    }

    customProgramCacheKey() {
      return options.programCacheKey || this._cacheKey || '0'
    }
  } as any

  // return new _ExtendedMaterial(properties)
}
