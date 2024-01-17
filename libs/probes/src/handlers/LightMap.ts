import { Mesh, MeshStandardMaterial, Texture } from 'three';
import {
  BakeFormat,
  BakeRenderLayer,
  LightMapGroupDefinition,
  LightMapPassDefinition,
  LightMapType,
  VisibilityRelation,
} from '..';

export class LightMap {
  type: LightMapType;
  name: string;
  objectNames: string[];
  passes: LightMapPassDefinition;
  format: BakeFormat;
  texture: Texture;
  visibility: VisibilityRelation;
  uvIndex: number;

  constructor(data: LightMapGroupDefinition, texture: Texture) {
    this.type = data.type;
    this.name = data.name;
    this.objectNames = [...data.object_names];
    this.passes = data.passes;
    this.format = data.format;
    this.uvIndex = data.uv_index;
    this.texture = texture;
    this.texture.channel = this.uvIndex;
  }

  createMaterial(mesh: Mesh, intensity: number = 1): MeshStandardMaterial {
    
    if (!mesh.material || !(mesh.material instanceof MeshStandardMaterial)) {
      return null;
    }

    const material = (mesh.material = new MeshStandardMaterial(mesh.material));

    material.lightMap = this.texture;
    material.lightMapIntensity = intensity;

    if (this.passes.use_pass_color) {
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
