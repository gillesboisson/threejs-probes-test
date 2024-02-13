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
import { cleanObjectName } from '../helpers';

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
    this.objectNames = data.objects.map(cleanObjectName);
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

    const isAO = this.passes.indexOf('AO') !== -1;
    
    if (isAO) {
      
      material.aoMap = this.texture;
      material.aoMapIntensity = intensity;
    } else {
      material.lightMap = this.texture;
      material.lightMapIntensity = intensity;
    }

    if (this.passes.indexOf('COLOR') !== -1) {
      material.map = null;
    }

    return material;
  }

  setupObject(
    mesh: Mesh,
    material: MeshStandardMaterial,
  ): void {
    mesh.material = material;
  }
}

export type LightMapGroup = LightMapGroupCoreDefinition<
  LightMap,
  VisibilityDefinition
>;
