import {
  BufferGeometry,
  Camera,
  IUniform,
  Material,
  MaterialParameters,
  Object3D,
  Scene,
  WebGLRenderer,
  UniformsUtils,
  UniformsGroup,
  MultiplyOperation,
  AddOperation,
  MixOperation,
  MeshLambertMaterial,
  CubeReflectionMapping,
  Vector3,
  ShaderLibShader,
  WebGLProgramParametersWithUniforms,
  Vector2,
} from 'three';
import { replaceShaderSourceIncludes } from './utils';
import {
  probesMaterialFragmentChunksOverride,
  probesMaterialVertexChunksOverride,
} from './shaderShunk';
import {
  defines,
  irradianceMapNames,
  maxIrradianceMaps,
  maxReflectionMaps,
  // materialUniforms,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from './shaderConstants';
import { ProbeVolumeHandler } from '../handlers/ProbeVolumeHandler';
import { IProbeMaterial, ProbeMode, ProbeRatio, ProbeRatioLod } from '../type';
import {
  IrradianceProbeVolume,
  ProbeVolumeRatio,
  ReflectionProbeVolume,
} from '../volume';
import { Probe } from '../type';

const irradianceRatioVarname = ratioVar('irradiance');
const reflectionRatioVarname = ratioVar('reflection');
const reflectionLodVarname = reflectionLodVar();



enum InternalProbeMode {
  Disabled = 0,
  Static = 1,
  FragmentRatio = 2,
}


export function extendProbesMaterial<
  MaterialT extends Material = Material,
  MaterialParamsT extends MaterialParameters = MaterialParameters
>(
  SuperMaterial: typeof Material,
  defaultParams: Partial<MaterialParamsT> = {},
  shaderDefinition?: {
    vertexShader?: (shader: string) => string;
    fragmentShader?: (shader: string) => string;
    uniforms?: Record<string, IUniform>;
    defines?: Record<string, any>;
  }
): {
  new (
    probeVolumeHander: ProbeVolumeHandler,
    params?: Partial<MaterialParamsT>
  ): MaterialT & IProbeMaterial;
} {
  return class ExtendedProbeMaterial extends SuperMaterial {
    protected uniforms: Record<string, IUniform>;
    protected uniformsGroups: UniformsGroup[] = [];
    readonly isShaderMaterial = true;
    protected uniformsNeedUpdate = false;
    private _irradianceProbeRatio: ProbeRatio[] = [];
    private _reflectionProbeRatio: ProbeRatioLod[] = [];

    protected _combine: number = MultiplyOperation;
    protected _reflectionProbeMapMode: number = CubeReflectionMapping;

    protected lastObject: Object3D | null = null;
    protected lastObjectPosition = new Vector3();
    protected objectPosition = new Vector3();

    protected _autoUpdateProbes: boolean = true;
    protected _needsProbeUpdate: boolean = true;

    protected _staticIrradianceProbe: Probe | null = null;
    protected _staticReflectionProbe: Probe | null = null;

    protected _cachedNearestIrradianceProbe: Probe | null = null;
    protected _cachedNearestReflectionProbe: Probe | null = null;

    protected _irradianceProbeMode: ProbeMode = ProbeMode.FragmentRatio;
    protected _reflectionProbeMode: ProbeMode = ProbeMode.FragmentRatio;

    protected _finalIrradianceProbeMode: InternalProbeMode =
      InternalProbeMode.FragmentRatio;
    protected _finalReflectionProbeMode: InternalProbeMode =
      InternalProbeMode.FragmentRatio;

    get irradianceProbeMode(): ProbeMode {
      return this._irradianceProbeMode;
    }

    set irradianceProbeMode(value: ProbeMode) {
      if (this._irradianceProbeMode !== value) {
        if (value !== ProbeMode.Static) {
          this._staticIrradianceProbe = null;
        } else if (!this._staticIrradianceProbe) {
          console.warn('Irradiance probe must be set when using static mode');
          return;
        }

        this._irradianceProbeMode = value;
        this.needsProbeUpdate = true;
      }
    }

    get reflectionProbeMode(): ProbeMode {
      return this._reflectionProbeMode;
    }

    set reflectionProbeMode(value: ProbeMode) {
      if (this._reflectionProbeMode !== value) {
        if (value !== ProbeMode.Static) {
          this._staticReflectionProbe = null;
        } else if (!this._staticReflectionProbe) {
          console.warn('Reflection probe must be set when using static mode');
          return;
        }

        this._reflectionProbeMode = value;
        this.needsProbeUpdate = true;
      }
    }

    set needsProbeUpdate(value: boolean) {
      if (this._needsProbeUpdate !== value) {
        this._needsProbeUpdate = value;
        this.needsUpdate = true;
      }
    }

    get staticIrradianceProbe(): Probe | null {
      return this._staticIrradianceProbe;
    }

    set staticIrradianceProbe(value: Probe | null) {
      this._staticIrradianceProbe = value;
      this._irradianceProbeMode = value
        ? ProbeMode.Static
        : ProbeMode.FragmentRatio;
      this.needsProbeUpdate = true;
    }

    get staticReflectionProbe(): Probe | null {
      return this._staticReflectionProbe;
    }

    set staticReflectionProbe(value: Probe | null) {
      this._staticReflectionProbe = value;
      this._cachedNearestReflectionProbe = value;
      this._reflectionProbeMode = value
        ? ProbeMode.Static
        : ProbeMode.FragmentRatio;
      this.needsProbeUpdate = true;
    }

    get autoUpdateProbes(): boolean {
      return this._autoUpdateProbes;
    }

    set autoUpdateProbes(value: boolean) {
      if (this._autoUpdateProbes !== value) {
        this._autoUpdateProbes = value;
        this.needsProbeUpdate = true;
      }
    }

    get reflectionProbeMapMode(): number {
      return this._reflectionProbeMapMode;
    }

    set reflectionProbeMapMode(value: number) {
      if (this._reflectionProbeMapMode !== value) {
        this._reflectionProbeMapMode = value;
        this.needsProbeUpdate = true;
      }
    }

    get combine(): number {
      return this._combine;
    }

    set combine(value: number) {
      if (this._combine !== value) {
        this._combine = value;
        this.needsUpdate = true;
      }
    }

    private _irradianceGlobalProbeRatio: ProbeVolumeRatio<IrradianceProbeVolume>[] =
      [];
    private _reflectionGlobalProbeRatio: ProbeVolumeRatio<ReflectionProbeVolume>[] =
      [];

    protected _probesIntensity: number = 1;

    get probesIntensity(): number {
      return this._probesIntensity;
    }

    set probesIntensity(value: number) {
      this._probesIntensity = value;
    }

    constructor(
      readonly probeVolumeHander: ProbeVolumeHandler,
      params: Partial<MaterialParamsT> = {}
    ) {
      super();

      if (shaderDefinition?.defines) {
        this.defines = {
          ...defines,
          ...shaderDefinition.defines,
        };
      }

      const uniforms: Record<string, IUniform> = shaderDefinition?.uniforms
        ? UniformsUtils.clone(shaderDefinition.uniforms)
        : {};

      irradianceMapNames.map((name) => {
        const uniform: IUniform = { value: null };
        uniforms[name] = uniform;
      });

      reflectionMapNames.map((name) => {
        const uniform: IUniform = { value: null };
        uniforms[name] = uniform;
      });

      uniforms[irradianceRatioVarname] = {
        value: new Float32Array(maxIrradianceMaps),
      };

      uniforms[reflectionLodVarname] = {
        value: new Float32Array(maxReflectionMaps * 3),
      };

      uniforms[reflectionRatioVarname] = {
        value: new Float32Array(maxReflectionMaps),
      };

      uniforms.probesIntensity = { value: this._probesIntensity };

      uniforms.staticIrradianceProbeMap = { value: null };
      uniforms.staticReflectionProbeMap = { value: null };
      uniforms.staticReflectionLod = { value: new Vector3() };

      this.uniforms = UniformsUtils.clone(uniforms);
      // debugger
      this.setValues({
        ...defaultParams,
        ...params,
        // uniforms,
      });
    }

    onBeforeRender(
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      geometry: BufferGeometry,
      object: Object3D,
      group: Object3D
    ) {
      const uniforms = this.uniforms;
      const probeVolumeHander = this.probeVolumeHander;

      let objectUniformsNeedsUpdate = false;
      this.objectPosition.setFromMatrixPosition(object.matrixWorld);

      const objectProbesNeedsUpdate =
        (this._autoUpdateProbes &&
          (this.lastObject !== object ||
            !this.lastObjectPosition.equals(this.objectPosition))) ||
        this._needsProbeUpdate;

      if (objectProbesNeedsUpdate) {
        this.lastObject = object;
        this.lastObjectPosition.copy(object.position);

        switch (this._reflectionProbeMode) {
          case ProbeMode.FragmentRatio:
            const reflectionProbeRatio = this._reflectionProbeRatio;

            const reflectionRatioBufferData = uniforms[reflectionRatioVarname]
              .value as Float32Array;
            const reflectionLodBufferData = uniforms[reflectionLodVarname]
              .value as Float32Array;

            probeVolumeHander.reflectionVolumes.getSuroundingProbes(
              object.position,
              reflectionProbeRatio,
              this._reflectionGlobalProbeRatio,
              (this as any).roughness
            );

            for (let i = 0; i < reflectionRatioBufferData.length; i++) {
              const iRatio = i * 3;

              if (i < reflectionProbeRatio.length) {
                if (
                  reflectionRatioBufferData[i] !== reflectionProbeRatio[i][1] ||
                  uniforms[reflectionMapNames[i]].value !==
                    reflectionProbeRatio[i][0].texture
                ) {
                  reflectionRatioBufferData[i] = reflectionProbeRatio[i][1];
                  uniforms[reflectionMapNames[i]].value =
                    reflectionProbeRatio[i][0].texture;
                  reflectionLodBufferData[iRatio] = reflectionProbeRatio[i][2];
                  reflectionLodBufferData[iRatio + 1] = reflectionProbeRatio[i][3];
                  reflectionLodBufferData[iRatio + 2] = reflectionProbeRatio[i][4];

                    
                  objectUniformsNeedsUpdate = true;
                }
              } else {
                if (
                  reflectionRatioBufferData[i] !== 0 ||
                  uniforms[reflectionMapNames[i]].value !== null
                ) {
                  reflectionRatioBufferData[i] = 0;
                  uniforms[reflectionMapNames[i]].value = null;
                  objectUniformsNeedsUpdate = true;
                }
              }
            }


            this._finalReflectionProbeMode =
              reflectionRatioBufferData.length > 0
                ? InternalProbeMode.FragmentRatio
                : InternalProbeMode.Disabled;
            break;
          case ProbeMode.Nearest:
            let lodStart = 0;
            let lodEnd = 0;
            let nbLevels = 0;

            let nearestReflectionProbe =
              probeVolumeHander.reflectionVolumes.getClosestProbe(
                object.position
              );

            if (nearestReflectionProbe.volume !== null) {
              lodStart = nearestReflectionProbe.volume.startRoughness;
              lodEnd = nearestReflectionProbe.volume.endRoughness;
              nbLevels = nearestReflectionProbe.volume.nbLevels;
            } else if (probeVolumeHander.globalEnv) {
              nearestReflectionProbe =
                probeVolumeHander.globalEnv.reflectionCubeProbe;
              if (nearestReflectionProbe) {
                lodStart =
                  probeVolumeHander.globalEnv.reflectionRoughnessMapping
                    .startRoughness;
                lodEnd =
                  probeVolumeHander.globalEnv.reflectionRoughnessMapping
                    .endRoughness;

                nbLevels =
                  probeVolumeHander.globalEnv.reflectionRoughnessMapping
                    .nbLevels;
              }
            }

            if (this._cachedNearestReflectionProbe !== nearestReflectionProbe) {
              this._cachedNearestReflectionProbe = nearestReflectionProbe;
              uniforms.staticReflectionProbeMap.value =
                nearestReflectionProbe?.texture;

              if (nearestReflectionProbe) {
                uniforms.staticReflectionLod.value.set(
                  lodStart,
                  lodEnd,
                  nbLevels
                );
              }

              objectUniformsNeedsUpdate = true;
            }

            // use static reflection probe rather than nearest as it makes no difference on shader side
            this._finalReflectionProbeMode =
              nearestReflectionProbe !== null
                ? InternalProbeMode.Static
                : InternalProbeMode.Disabled;
            break;
          case ProbeMode.Static:
            if (
              uniforms.staticReflectionProbeMap.value !==
              this._staticReflectionProbe.texture
            ) {
              uniforms.staticReflectionProbeMap.value =
                this._staticReflectionProbe.texture;
              objectUniformsNeedsUpdate = true;
            }

            // use static reflection probe rather than nearest as it makes no difference on shader side
            this._finalReflectionProbeMode =
              this._staticReflectionProbe !== null
                ? InternalProbeMode.Static
                : InternalProbeMode.Disabled;

            break;
        }

        switch (this._irradianceProbeMode) {
          case ProbeMode.FragmentRatio:
            const irradianceProbeRatio = this._irradianceProbeRatio;

            const irradianceRatioBufferData = uniforms[irradianceRatioVarname]
              .value as Float32Array;
            probeVolumeHander.irradianceVolumes.getSuroundingProbes(
              object.position,
              irradianceProbeRatio,
              this._irradianceGlobalProbeRatio
            );

            for (let i = 0; i < irradianceRatioBufferData.length; i++) {
              const ut = uniforms[irradianceMapNames[i]];

              if (i < irradianceProbeRatio.length) {
                if (
                  irradianceRatioBufferData[i] !== irradianceProbeRatio[i][1] ||
                  ut.value !== irradianceProbeRatio[i][0].texture
                ) {
                  irradianceRatioBufferData[i] = irradianceProbeRatio[i][1];
                  ut.value = irradianceProbeRatio[i][0].texture;
                  objectUniformsNeedsUpdate = true;
                }
              } else {
                if (irradianceRatioBufferData[i] !== 0 || ut.value !== null) {
                  objectUniformsNeedsUpdate = true;
                  irradianceRatioBufferData[i] = 0;
                  ut.value = null;
                }
              }
            }

            this._finalIrradianceProbeMode =
              irradianceRatioBufferData.length > 0
                ? InternalProbeMode.FragmentRatio
                : InternalProbeMode.Disabled;

            break;

          case ProbeMode.Nearest:
            let nearestIrradianceProbe =
              probeVolumeHander.irradianceVolumes.getClosestProbe(
                object.position
              );
            if (nearestIrradianceProbe === null) {
              nearestIrradianceProbe =
                probeVolumeHander.globalEnv?.irradianceCubeProbe || null;
            }

            if (this._cachedNearestIrradianceProbe !== nearestIrradianceProbe) {
              this._cachedNearestIrradianceProbe = nearestIrradianceProbe;
              uniforms.staticIrradianceProbeMap.value =
                nearestIrradianceProbe?.texture;
              objectUniformsNeedsUpdate = true;
            }

            this._finalIrradianceProbeMode =
              nearestIrradianceProbe !== null
                ? InternalProbeMode.Static
                : InternalProbeMode.Disabled;
            break;

          case ProbeMode.Static:
            if (
              uniforms.staticIrradianceProbeMap.value !==
              this._staticIrradianceProbe.texture
            ) {
              uniforms.staticIrradianceProbeMap.value =
                this._staticIrradianceProbe.texture;
              objectUniformsNeedsUpdate = true;
            }

            this._finalIrradianceProbeMode =
              this._staticIrradianceProbe !== null
                ? InternalProbeMode.Static
                : InternalProbeMode.Disabled;
            break;
        }

        this._needsProbeUpdate = false;
      }

      if (
        (this as any).reflectivity !== undefined &&
        uniforms.reflectivity !== undefined
      ) {
        uniforms.reflectivity.value = (this as any).reflectivity;
      }

      if ((this as any).ior !== undefined && uniforms.ior !== undefined) {
        uniforms.ior.value = (this as any).ior;
      }

      if (
        (this as any).refractionRatio !== undefined &&
        uniforms.refractionRatio !== undefined
      ) {
        uniforms.refractionRatio.value = (this as any).refractionRatio;
      }

      uniforms.probesIntensity.value = this._probesIntensity;
      this.uniformsNeedUpdate = objectUniformsNeedsUpdate;
    }

    customProgramCacheKey(): string {
      return (
        'probes,' +
        this._combine +
        ',' +
        this._reflectionProbeMapMode +
        ',' +
        this._finalIrradianceProbeMode +
        ',' +
        this._finalReflectionProbeMode
      );
    }

    onBeforeCompile(
      shader: WebGLProgramParametersWithUniforms,
      renderer: WebGLRenderer
    ): void {

      for (let key in this.uniforms) {
        if (shader.uniforms[key]) {
          shader.uniforms[key].value = this.uniforms[key].value;
        } else {
          shader.uniforms[key] = this.uniforms[key];
        }
      }
      this.uniforms = shader.uniforms;

      shader.vertexShader = shaderDefinition?.vertexShader
        ? shaderDefinition.vertexShader(shader.vertexShader)
        : replaceShaderSourceIncludes(
            shader.vertexShader,
            probesMaterialVertexChunksOverride
          );

      shader.fragmentShader = shaderDefinition?.fragmentShader
        ? shaderDefinition.fragmentShader(shader.fragmentShader)
        : replaceShaderSourceIncludes(
            shader.fragmentShader,
            probesMaterialFragmentChunksOverride
          );
      (shader as any).defines = {
        ...(shader as any).defines,
        ...defines,
      };

      (shader as any).defines.USE_STATIC_IRRADIANCE_PROBE =
        this._finalIrradianceProbeMode === InternalProbeMode.Static;

      (shader as any).defines.USE_STATIC_REFLECTION_PROBE =
        this._finalReflectionProbeMode === InternalProbeMode.Static;

      (shader as any).defines.USE_RATIO_IRRADIANCE_PROBE =
        this._finalIrradianceProbeMode === InternalProbeMode.FragmentRatio;

      (shader as any).defines.USE_RATIO_REFLECTION_PROBE =
        this._finalReflectionProbeMode === InternalProbeMode.FragmentRatio;

      (shader as any).defines.USE_REFLECTION_PROBE =
        this._finalReflectionProbeMode !== InternalProbeMode.Disabled;

      (shader as any).defines.USE_IRRADIANCE_PROBE =
        this._finalIrradianceProbeMode !== InternalProbeMode.Disabled;

      // override probe operation for lambert, phong based material
      // in order to replicate envmap behaviour
      if (this._combine === MultiplyOperation) {
        (shader as any).defines.PROBE_BLENDING_MULTIPLY = true;
      } else if (this._combine === AddOperation) {
        (shader as any).defines.PROBE_BLENDING_ADD = true;
      } else if (this._combine === MixOperation) {
        (shader as any).defines.PROBE_BLENDING_MIX = true;
      }

      if (this._reflectionProbeMapMode === CubeReflectionMapping) {
        (shader as any).defines.PROBE_MODE_REFLECTION = true;
      } else {
        (shader as any).defines.PROBE_MODE_REFRACTION = true;
      }

      super.onBeforeCompile(shader, renderer);
    }

    copy(material: this): this {
      super.copy(material);
      this._probesIntensity =
        material.probesIntensity !== undefined ? material.probesIntensity : 1;

      return this;
    }

    clone(): this {
      return new (this.constructor as any)(this.probeVolumeHander).copy(this);
    }

    toJSON(meta?: any) {
      const data = super.toJSON(meta);

      data.probesIntensity = this._probesIntensity;

      return data;
    }
  } as any;
}
