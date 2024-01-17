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

export class ProbeVolumeHandler extends BaseBakeHandler<Material, Mesh> {
  private _irradianceProbeRatio: ProbeRatio[] = [];
  private _reflectionProbeRatio: ProbeRatioLod[] = [];

  readonly irradianceVolumes = new IrradianceProbeVolumeGroup();
  readonly reflectionVolumes = new ReflectionProbeVolumeGroup();

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

  // public public isStaticObject(objectName: string): boolean {
  //   return super.isStaticObject(objectName);
  // }

  mapMaterial(material: Material): AnyMeshProbeMaterial {
    switch (true) {
      case material instanceof MeshStandardMaterial:
        return new MeshProbeStandardMaterial(this, material);

      case material instanceof MeshPhysicalMaterial:
        return new MeshProbePhysicalMaterial(this, material);

      case material instanceof MeshProbeLambertMaterial:
        return new MeshProbeLambertMaterial(this, material);

      case material instanceof MeshProbePhongMaterial:
        return new MeshProbePhongMaterial(this, material);

      case material instanceof MeshProbeStandardMaterial ||
        material instanceof MeshProbeLambertMaterial ||
        material instanceof MeshProbePhongMaterial ||
        material instanceof MeshProbeLambertMaterial:
        return material as AnyMeshProbeMaterial;

      default:
        throw new Error(
          `Unsupported material type ${material.constructor.name}`
        );
    }
  }

  setupObject(mesh: Mesh, setupLayers = true): boolean {
    if (!this.isStaticObject(mesh.name)) {
      if (this._addMesh(mesh)) {
        if (setupLayers) {
          mesh.layers.enable(BakeRenderLayer.Active);
          // mesh.layers.enable(BakeRenderLayer.StaticLights);
        }

        // if mesh.material is an array, we need to map each material

        if (!Array.isArray(mesh.material)) {
          const material = this.mapMaterial(mesh.material);
          mesh.material = material;

          if (this._addMaterial(material)) {
            
          }
        }
      }

      return true;
    }

    return false;
  }

  removeMesh(mesh: Mesh): void {}

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
