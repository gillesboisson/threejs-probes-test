import { Mesh, MeshStandardMaterial, Texture } from 'three';
import {
  BakeFormat,
  BakeRenderLayer, LightMapGroupDefinition, LightMapPassDefinition,
  LightMapType, VisibilityRelation
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
  }

  addToMaterial(
    mesh: Mesh,
    intensity: number = 1,
    setObjectRenderLayer: boolean = false
  ) {
    if (!mesh.material || !(mesh.material instanceof MeshStandardMaterial)) {
      return;
    }

    const material = mesh.material as MeshStandardMaterial;
    material.lightMap = this.texture;
    material.lightMapIntensity = intensity;

    this.texture.channel = this.uvIndex;

    if (this.passes.use_pass_color) {
      material.map = null;
    }

    if (setObjectRenderLayer) {
      mesh.layers.disableAll();
      mesh.layers.enable(BakeRenderLayer.Static);

      // if (!this.passes.use_pass_direct) {
      //   mesh.layers.enable(BakeRenderLayer.StaticLights);
      // }
    }
  }
}
