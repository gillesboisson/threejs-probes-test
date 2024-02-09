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
import { BaseBakeSceneMapper } from './BakeSceneMapper';
import { BakeRenderLayer, VisibilityDefinition } from '..';
import {
  AnyMeshProbeMaterial,
  ConvertibleMeshProbeMaterial,
  MeshProbeLambertMaterial,
  MeshProbePhongMaterial,
  MeshProbePhysicalMaterial,
  MeshProbeStandardMaterial,
} from '../materials';

export class ProbeVolumeHandler extends BaseBakeSceneMapper<AnyMeshProbeMaterial> {
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

  public filterMesh:
    | null
    | ((mesh: Mesh, handler: ProbeVolumeHandler) => boolean) = null;

  public mapMaterial:
    | null
    | ((
        mesh: Mesh,
        material: ConvertibleMeshProbeMaterial,
        handler: ProbeVolumeHandler
      ) => AnyMeshProbeMaterial) = null;

  public mapObject:
    | null
    | ((
        object: Mesh,
        material: AnyMeshProbeMaterial,
        handler: ProbeVolumeHandler
      ) => Mesh) = null;

  protected _filterMesh(mesh: Mesh, data: unknown): boolean {
    if (this.filterMesh !== null) {
      return this.filterMesh(mesh, this);
    }
    return true;
  }

  protected _mapObject(object: Mesh, material: AnyMeshProbeMaterial) {
    if (this.mapObject !== null) {
      return this.mapObject(object, material, this);
    }
    return object;
  }

  public materialToProbeMaterial<MaterialT extends AnyMeshProbeMaterial>(
    material: ConvertibleMeshProbeMaterial
  ): MaterialT | null {
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

    return finalMmaterial as MaterialT;
  }

  protected _mapMaterial(mesh: Mesh, material: ConvertibleMeshProbeMaterial): AnyMeshProbeMaterial {
    let finalMmaterial: AnyMeshProbeMaterial =
      this.mapMaterial !== null
        ? this.mapMaterial(mesh, material, this)
        : this.materialToProbeMaterial(material);

    finalMmaterial.probesIntensity = this._lightIntensity;
    return finalMmaterial;
  }

  protected _setupObject(mesh: Mesh, material: Material, setupLayers = true) {}

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
