import { Mesh, MeshStandardMaterial, Texture } from 'three';
import {
  BakeFormat,
  BakeRenderLayer,
  LightMapCoreDefinition,
  LightMapDefinition,
  LightMapGroupCoreDefinition,
  LightMapGroupDefinition,
  LightMapPass,
  LightMapType,
  VisibilityDefinition,
  VisibilityRelation,
} from '../data';

export class LightMap {
  readonly type: LightMapType;
  readonly name: string;
  readonly objectNames: string[];
  readonly passes: LightMapPass;
  readonly format: BakeFormat;
  readonly texture: Texture;
  readonly visibility: VisibilityRelation;
  readonly uvIndex: number;

  constructor(data: LightMapDefinition, group: LightMapGroupDefinition) {
    this.type = group.type;
    this.name = group.name;
    this.objectNames = data.objects;
    this.passes = group.passes;
    this.format = group.format;
    this.uvIndex = group.uv_index;
    this.texture = data.map;
    this.texture.channel = this.uvIndex;
  }

  createMaterial(mesh: Mesh, intensity: number = 1): MeshStandardMaterial {
    if (!mesh.material || !(mesh.material instanceof MeshStandardMaterial)) {
      return null;
    }

    const material = (mesh.material = new MeshStandardMaterial(mesh.material));

    material.lightMap = this.texture;
    material.lightMapIntensity = intensity;

    if (this.passes.indexOf('COLOR') !== -1) {
      material.map = null;
    }

    return material;
  }

  setupObject(
    mesh: Mesh,
    material: MeshStandardMaterial,
    setObjectRenderLayer: boolean = false
  ): void {
    mesh.material = material;
    if (setObjectRenderLayer) {
      mesh.layers.disableAll();
      mesh.layers.enable(BakeRenderLayer.Static);
    }
  }
}

export type LightMapGroup = LightMapGroupCoreDefinition<
  LightMap,
  VisibilityDefinition
>;
