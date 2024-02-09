import {
  BufferGeometry,
  Material,
  Mesh,
  NormalBufferAttributes,
  Object3D,
  Object3DEventMap,
} from 'three';
import { VisibilityDefinition } from '../data';

import { cleanObjectName } from '../helpers';
import { HasObjectMapper } from '../type';

export type BakeSceneMapperMapMaterial<
  SourceMaterialT extends Material = Material,
  ResultMaterialT extends Material = SourceMaterialT
> = (mesh: Mesh, material: SourceMaterialT, data: any) => ResultMaterialT;

export type BakeSceneMapperFilterMesh<DataT> = (
  mesh: Mesh,
  data: DataT
) => boolean;

export type BakeSceneMapperMapObject<
  MaterialT extends Material | Material[] = Material,
  DataT = unknown
> = (mesh: Mesh, material: MaterialT, data: DataT) => Mesh;

export type BakeSceneMapperSetupObject<
  MaterialT extends Material = Material> = (mesh: Mesh, material: MaterialT) => void;



export abstract class BaseBakeSceneMapper<
  MaterialT extends Material,
  DataT = unknown
> {
  protected _objects: Object3D[] = [];
  protected _materials: MaterialT[] = [];
  protected _sourceMaterials: MaterialT[] = [];

  public cacheMaterials: boolean = true;

  // protected _staticObjectNames: string[];
  protected _data: any[];

  public get staticObjectNames() {
    throw new Error('Not implemented');
    return [];
  }

  constructor(protected _visibilities: VisibilityDefinition[]) {}

  protected _reset() {
    this._objects = [];
    this._materials = [];
    this._sourceMaterials = [];
    this._data = [];
  }

  protected abstract _setupObject(mesh: Mesh, material: MaterialT): void;

  protected abstract _mapMaterial(
    mesh: Mesh,
    material: MaterialT,
    data: DataT
  ): MaterialT;

  protected abstract _mapObject(object: Mesh, material: MaterialT, data: DataT): Mesh;

  protected abstract _filterMesh(mesh: Mesh, data: DataT): boolean;

  protected getCachedMaterial(
    mesh: Mesh,
    sourceMaterial: MaterialT,
    data: DataT
  ): MaterialT {

    const ind = this._sourceMaterials.indexOf(sourceMaterial as MaterialT);

    if (ind > -1) {
      return this._materials[ind];
    }

    return null;
  }

  public removeMesh(mesh: Mesh): void {
    if (this._removeObject(mesh)) {
      this._removeMaterial(mesh.material as MaterialT);
    }
  }

  public getMeshData(mesh: Mesh): DataT {
    return null;
  }

  public addMesh(mesh: Mesh): boolean {
    const data = this.getMeshData(mesh);
    const match = this._filterMesh(mesh, data);
    const sourceMaterial = mesh.material as MaterialT;

    if (match) {
      const finalMesh = this._mapObject(mesh, sourceMaterial as MaterialT, data);
      if (this._addObject(finalMesh, data)) {
        let material = this.cacheMaterials === true ? this.getCachedMaterial(
          mesh,
          sourceMaterial as MaterialT,
          data
        ) : null;

        if (material === null) {
          material = this._mapMaterial(
            finalMesh,
            finalMesh.material as MaterialT,
            data
          );
          this._addMaterial(material, sourceMaterial);
        }

        finalMesh.material = material;
        this._setupObject(finalMesh, material);
      }
    }

    return match;
  }

  protected _addObject(mesh: Object3D, data: DataT): boolean {
    if (!this._objects.includes(mesh)) {
      this._objects.push(mesh);
      this._data.push(data);
      return true;
    }

    return false;
  }

  protected _addMaterial(
    material: MaterialT,
    sourceMaterial: MaterialT
  ): boolean {
    if (!this._materials.includes(material)) {
      this._materials.push(material);
      this._sourceMaterials.push(sourceMaterial);
      return true;
    }

    return false;
  }

  protected _removeObject(mesh: Object3D): boolean {
    const index = this._objects.indexOf(mesh);
    if (index > -1) {
      this._objects.splice(index, 1);
      this._data.splice(index, 1);

      return true;
    }

    return false;
  }

  protected _removeMaterial(material: MaterialT): boolean {
    const index = this._materials.indexOf(material);
    if (index > -1) {
      this._materials.splice(index, 1);
      this._sourceMaterials.splice(index, 1);
      return true;
    }
    return false;
  }
}

export class BakeSceneMapper<
  MaterialT extends Material = Material,
  DataT = void
> extends BaseBakeSceneMapper<MaterialT, DataT> {
  constructor(visibility: VisibilityDefinition[]) {
    super(visibility);
  }

  

  get mapMaterial(): BakeSceneMapperMapMaterial<MaterialT, MaterialT> {
    return this._mapMaterial;
  }

  get filterMesh(): BakeSceneMapperFilterMesh<DataT> {
    return this._filterMesh;
  }

  get mapObject(): BakeSceneMapperMapObject<MaterialT, DataT> {
    return this._mapObject;
  }

  get setupObject(): BakeSceneMapperSetupObject<MaterialT> {
    return this._setupObject;
  }

  set mapMaterial(value: BakeSceneMapperMapMaterial<MaterialT, MaterialT>) {
    this._mapMaterial = value;
  }

  set filterMesh(value: BakeSceneMapperFilterMesh<DataT>) {
    this._filterMesh = value;
  }

  set mapObject(value: BakeSceneMapperMapObject<MaterialT, DataT>) {
    this._mapObject = value;
  }

  set setupObject(value: BakeSceneMapperSetupObject<MaterialT>) {
    this._setupObject = value;
  }

  protected _mapObject(object: Mesh, material: MaterialT, data: DataT): Mesh {
    return object;
  }

  protected _setupObject(mesh: Mesh, material: MaterialT): void {
    mesh.material = material;
  }

  protected _mapMaterial(mesh: Mesh, material: MaterialT, data: DataT): MaterialT {
    return material;
  }

  protected _filterMesh(mesh: Mesh, data: DataT): boolean {
    return true;
  }
}
