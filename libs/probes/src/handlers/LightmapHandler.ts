import { Mesh, MeshStandardMaterial, Texture } from 'three';
import { BaseBakeHandler } from './BaseBakeHandler';
import { LightMap, LightMapGroup } from './LightMap';

import { BakeRenderLayer, LightMapGroupDefinition, VisibilityDefinition } from '../data';
import { cleanObjectName } from '../helpers';

export class LightmapHandler extends BaseBakeHandler<
  MeshStandardMaterial,
  LightMap
> {
  protected definition: LightMapGroup[] | null = null;

  protected lightmaps: LightMap[] | null = null;

  // protected lights: Light[] = null;
  // protected staticObjectNames: string[] = null;

  protected _displayMap = true;
  protected _displayLightmap = true;

  protected _map: Texture = null;
  protected _lightmap: Texture = null;

  get displayMap(): boolean {
    return this._displayMap;
  }

  set displayMap(value: boolean) {
    if (value !== this._displayMap) {
      this._displayMap = value;
      for (let mat of this._materials) {
        if (this.displayMap) {
          if ((mat as any).__map) {
            mat.map = (mat as any).__map;
          }
        } else {
          (mat as any).__map = mat.map;
          mat.map = null;
        }
      }
    }
  }

  get displayLightmap(): boolean {
    return this._displayLightmap;
  }

  set displayLightmap(value: boolean) {
    if (value !== this._displayLightmap) {
      this._displayLightmap = value;
      for (let mat of this._materials) {
        for (let mesh of this._objects) {
          mesh.layers.disableAll();
          mesh.layers.enable(
            this._displayLightmap
              ? BakeRenderLayer.Static
              : BakeRenderLayer.Active
          );
        }

        if (this.displayLightmap) {
          if ((mat as any).__lightMap) {
            mat.lightMap = (mat as any).__lightMap;
          }
        } else {
          (mat as any).__lightMap = mat.lightMap;
          mat.lightMap = null;
        }
      }
    }
  }

  protected _lightMapIntensity = 1;

  get lightMapIntensity(): number {
    return this._lightMapIntensity;
  }

  set lightMapIntensity(val: number) {
    if (val !== this._lightMapIntensity) {
      for (const mat of this._materials) {
        mat.lightMapIntensity = val;
      }
      this._lightMapIntensity = val;
    }
  }

  // materials: MaterialType[] = [];

  constructor(
    data: LightMapGroupDefinition[],
    visibilities: VisibilityDefinition[]
  ) {
    super(visibilities);

    this.setData(data);
  }

  protected _reset(): void {
    super._reset();
    this._sourceMaterials = [];
  }

  setData(groupDefinition: LightMapGroupDefinition[]) {
    if (groupDefinition !== null) {
      this._staticObjectNames = [];
      this.lightmaps = [];

      this.definition = groupDefinition.map(
        (groupDefinition): LightMapGroup => {
          const maps = groupDefinition.maps.map((map) => {
            this._staticObjectNames.push(...(map.objects.map(cleanObjectName)));
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
      this._staticObjectNames = [];
    }
  }

  filterMesh(mesh: Mesh, data: LightMap): boolean {
    return (
      data &&
      mesh.material instanceof MeshStandardMaterial &&
      super.filterMesh(mesh, data)
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
        
        if (material.lightMap === data.texture) {
          return material;
        }
      }
    }

    return null;
  }

  mapMaterial(
    mesh,
    material: MeshStandardMaterial,
    lightmap: LightMap
  ): MeshStandardMaterial {
    return lightmap.createMaterial(mesh, this._lightMapIntensity);
  }

  setupObject(
    mesh: Mesh,
    material: MeshStandardMaterial,
    setupLayers = true
  ): void {
    const lightmap = this.lightmaps?.find((l) =>
      l.objectNames.includes(mesh.name)
    );

    if (!lightmap) {
      throw new Error('No lightmap data');
    }

    lightmap.setupObject(mesh, material, setupLayers);
  }

  removeMesh(mesh: Mesh, resetMaterial: boolean = true) {
    if (this._objects) {
      if (this._removeObject(mesh)) {
        if (resetMaterial) {
          mesh.layers.disableAll();
          mesh.layers.enable(0);
        }

        if (this._removeMaterial(mesh.material as MeshStandardMaterial)) {
          if (resetMaterial) {
            (mesh.material as MeshStandardMaterial).lightMap = null;
          }
        }
      }
    }
  }
}
