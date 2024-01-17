import { Light, Mesh, MeshStandardMaterial, SpotLight, Texture } from 'three';
import {
  BakeRenderLayer,
  LightMapDefinition,
  LightMapGroupDefinition,
  LightMapGroupJSON,
  VisibilityDefinition,
} from '..';
import { BaseBakeHandler } from './BaseBakeHandler';
import { LightMap } from './LightMap';

export class LightmapHandler extends BaseBakeHandler<
  MeshStandardMaterial,
  Mesh
> {
  protected data: LightMapGroupDefinition[] | null = null;

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
        }else{
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
        if (this.displayLightmap) {
          if ((mat as any).__lightMap) {
            mat.lightMap = (mat as any).__lightMap;
          }
        }else{
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
    visibilities: VisibilityDefinition[],
    textures: Texture[]
  ) {
    super(visibilities);

    if (data && textures) {
      this.setData(data, textures);
    }
  }

  setData(data: LightMapGroupDefinition[], textures: Texture[]) {
    if (data !== null) {
      this.data = data;

      this.lightmaps = data.map((d, ind) => {
        const texture = textures[ind];
        return new LightMap(d, texture);
      });

      this._staticObjectNames = this.data.map((d) => d.object_names).flat();
      this._reset();
    } else {
      this.lightmaps = null;
      this.data = null;
      this._staticObjectNames = [];
    }
  }

  setupObject(mesh: Mesh, setupLayers = true): boolean {
    if (!this.data) {
      throw new Error('No lightmap data');
    }

    if (!this.isStaticObject(mesh.name)) {
      return false;
    }

    if (!(mesh.material instanceof MeshStandardMaterial)) {
      if (setupLayers) {
        mesh.layers.disableAll();
        // mesh.layers.enable(BakeRenderLayer.StaticLights);
        mesh.layers.enable(BakeRenderLayer.Active);
        // mesh.layers.enable(BakeRenderLayer.Static);
      }

      return false;
    }

    const lightmap = this.lightmaps?.find((l) =>
      l.objectNames.includes(mesh.name)
    );
    if (!lightmap) {
      return false;
    }

    if (this._addMesh(mesh)) {
      lightmap.addToMaterial(mesh, this._lightMapIntensity, setupLayers);

      if (this._addMaterial(mesh.material as MeshStandardMaterial)) {
      }
    }

    return true;
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
