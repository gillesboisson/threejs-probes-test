import {
  BufferGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NormalBufferAttributes,
  Object3DEventMap,
  Scene,
  Texture,
  Vector3,
} from 'three';
import {
  AnyProbeVolume,
  IrradianceProbeVolumeGroup,
  ReflectionProbeVolumeGroup,
  GlobalEnvVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume';
import { ProbeRatio, ProbeRatioLod } from '../type';
import { BaseBakeHandler } from './BaseBakeHandler';
import { BakeRenderLayer, VisibilityDefinition } from '..';
import {
  AnyMeshProbeMaterial,
  MeshProbeLambertMaterial,
  MeshProbePhongMaterial,
  MeshProbePhysicalMaterial,
  MeshProbeStandardMaterial,
} from '../materials';
import { IProbeMaterial } from '../materials/extendProbesMaterial';

export class ProbeVolumeHandler extends BaseBakeHandler<AnyMeshProbeMaterial> {
  private _irradianceProbeRatio: ProbeRatio[] = [];
  private _reflectionProbeRatio: ProbeRatioLod[] = [];

  readonly irradianceVolumes = new IrradianceProbeVolumeGroup();
  readonly reflectionVolumes = new ReflectionProbeVolumeGroup();

  protected _lightIntensity = 1;

  get lightIntensity(): number {
    return this._lightIntensity;
  }

  set lightIntensity(val: number) {
    if (val !== this._lightIntensity) {
      for (let mat of this._materials) {
        mat.probesIntensity = val;
      }
      this._lightIntensity = val;
    }
  }

  constructor(
    volumes: AnyProbeVolume[],
    visibility: VisibilityDefinition[],
    protected _globalEnv: GlobalEnvVolume | null = null
  ) {
    super(visibility);
    this.addVolume(...volumes);

    if (_globalEnv) {
      this.reflectionVolumes.fallbackVolume = _globalEnv;
      this.irradianceVolumes.fallbackVolume = _globalEnv;
    }
    this._reset();
  }

  get globalEnv() {
    return this._globalEnv;
  }

  set globalEnv(value: GlobalEnvVolume | null) {
    if (value !== this._globalEnv) {
      this._globalEnv = value;
      this.reflectionVolumes.fallbackVolume = value;
      this.irradianceVolumes.fallbackVolume = value;
    }
  }

  filterMesh(
    mesh: Mesh,
    data: unknown,
    sourceMaterial: Material,
  ): boolean {
    return !super.filterMesh(mesh, data, sourceMaterial);
  }

  mapMaterial(mesh: Mesh, material: Material): AnyMeshProbeMaterial {
    let finalMmaterial: AnyMeshProbeMaterial = null;

    switch (true) {
      case material instanceof MeshStandardMaterial:
        finalMmaterial = new MeshProbeStandardMaterial(this, material);
        break;
      case material instanceof MeshPhysicalMaterial:
        finalMmaterial = new MeshProbePhysicalMaterial(this, material);
        break;
      case material instanceof MeshProbeLambertMaterial:
        finalMmaterial = new MeshProbeLambertMaterial(this, material);
        break;
      case material instanceof MeshProbePhongMaterial:
        finalMmaterial = new MeshProbePhongMaterial(this, material);
        break;
      case material instanceof MeshProbeStandardMaterial ||
        material instanceof MeshProbeLambertMaterial ||
        material instanceof MeshProbePhongMaterial ||
        material instanceof MeshProbeLambertMaterial:
        finalMmaterial = material as AnyMeshProbeMaterial;
        break;
      default:
        throw new Error(
          `Unsupported material type ${material.constructor.name}`
        );
    }

    finalMmaterial.probesIntensity = this._lightIntensity;
    return finalMmaterial;
  }

  setupObject(mesh: Mesh, material: Material, setupLayers = true) {
    if (setupLayers) {
      // debugger
      mesh.layers.enable(BakeRenderLayer.Active);
      // mesh.layers.enable(BakeRenderLayer.StaticLights);
    }
  }

  addVolume(...volumes: AnyProbeVolume[]) {
    volumes
      .filter((v) => v instanceof IrradianceProbeVolume)
      .forEach((v) => {
        this.irradianceVolumes.addVolume(v as IrradianceProbeVolume);
      });

    volumes
      .filter((v) => v instanceof ReflectionProbeVolume)
      .forEach((v) => {
        this.reflectionVolumes.addVolume(v as ReflectionProbeVolume);
      });
  }

  removeVolume(...volumes: AnyProbeVolume[]) {
    volumes
      .filter((v) => v instanceof IrradianceProbeVolume)
      .forEach((v) => {
        this.irradianceVolumes.removeVolume(v as IrradianceProbeVolume);
      });

    volumes
      .filter((v) => v instanceof ReflectionProbeVolume)
      .forEach((v) => {
        this.reflectionVolumes.removeVolume(v as ReflectionProbeVolume);
      });
  }
}
