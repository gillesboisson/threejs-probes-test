import { Material, Mesh, MeshStandardMaterial, Texture } from 'three';
import { BaseBakeSceneMapper } from './BakeSceneMapper';
import { LightMap, LightMapGroup } from './LightMap';

import {
  BakeRenderLayer,
  LightMapGroupDefinition,
  VisibilityDefinition,
} from '../data';
import { cleanObjectName } from '../helpers';

export class LightmapHandler extends BaseBakeSceneMapper<
  MeshStandardMaterial,
  LightMap
> {
  protected definition: LightMapGroup[] | null = null;

  protected lightmaps: LightMap[] | null = null;

  protected _displayMap = true;
  protected _displayLightmap = true;
  protected _displayAOMap = true;

  protected _map: Texture = null;
  protected _lightmap: Texture = null;

  public defaultEnvTexture: Texture = null;

  constructor(
    data: LightMapGroupDefinition[],
    visibilities: VisibilityDefinition[]
  ) {
    super(visibilities);

    this.setData(data);
  }

  protected _mapObject(object: Mesh, material: MeshStandardMaterial) {
    return object;
  }

  protected _reset(): void {
    super._reset();
    this._sourceMaterials = [];
  }

  setData(groupDefinition: LightMapGroupDefinition[]) {
    if (groupDefinition !== null) {
      // this._staticObjectNames = [];
      this.lightmaps = [];

      this.definition = groupDefinition.map(
        (groupDefinition): LightMapGroup => {
          const maps = groupDefinition.maps.map((map) => {
            // this._staticObjectNames.push(...map.objects.map(cleanObjectName));
            return new LightMap(map, groupDefinition);
          });
          this.lightmaps.push(...maps);

          return {
            ...groupDefinition,
            maps,
          };
        }
      );

      this._reset();
    } else {
      this.lightmaps = null;
      this.definition = null;
      // this._staticObjectNames = [];
    }
  }

  protected _filterMesh(mesh: Mesh, data: LightMap): boolean {
    return (
      data &&
      mesh.material instanceof MeshStandardMaterial &&
      data.objectNames.includes(mesh.name)
    );
  }

  public getMeshData(mesh: Mesh): LightMap {
    return this.lightmaps?.find((l) => l.objectNames.includes(mesh.name));
  }

  protected getCachedMaterial(
    mesh: Mesh,
    sourceMaterial: MeshStandardMaterial,
    data?: LightMap
  ): MeshStandardMaterial {
    // return cached material only if source material matched and it uses the same lightmap
    for (let i = 0; i < this._sourceMaterials.length; i++) {
      if (this._sourceMaterials[i] === sourceMaterial) {
        const material = this._materials[i];
        const isAO = data.passes.indexOf('AO') !== -1;

        if (isAO && material.aoMap === data.texture) {
          return material;
        } else if (material.lightMap === data.texture) {
          return material;
        }
      }
    }

    return null;
  }

  protected _mapMaterial(
    mesh,
    material: MeshStandardMaterial,
    lightmap: LightMap
  ): MeshStandardMaterial {
    const mat = lightmap.createMaterial(mesh);
    if (
      this.defaultEnvTexture &&
      mat.envMap === null &&
      mat.lightMap === null
    ) {
      mat.envMap = this.defaultEnvTexture;
      mat.envMapIntensity = 1;
    }
    return mat;
  }

  protected _setupObject(mesh: Mesh, material: MeshStandardMaterial): void {
    const lightmap = this.lightmaps?.find((l) =>
      l.objectNames.includes(mesh.name)
    );

    if (!lightmap) {
      throw new Error('No lightmap data');
    }

    lightmap.setupObject(mesh, material);
  }

  removeMesh(mesh: Mesh, resetMaterial: boolean = true) {
    if (this._objects) {
      if (this._removeObject(mesh)) {
        if (this._removeMaterial(mesh.material as MeshStandardMaterial)) {
          if (resetMaterial) {
            (mesh.material as MeshStandardMaterial).lightMap = null;
          }
        }
      }
    }
  }
}
