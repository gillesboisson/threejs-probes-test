import { Material, Mesh, Object3D } from 'three';
import { VisibilityDefinition } from '../data';

import { cleanObjectName } from '../helpers';
import { HasObjectMapper } from '../type';

export abstract class BaseBakeHandler<
  MaterialT extends Material,
  DataT = unknown
> {
  protected _objects: Object3D[] = [];
  protected _materials: MaterialT[] = [];
  protected _sourceMaterials: MaterialT[] = [];

  protected _staticObjectNames: string[];
  protected _data: any[];

  public get staticObjectNames() {
    return this._staticObjectNames;
  }

  constructor(protected _visibilities: VisibilityDefinition[]) {
    this._staticObjectNames = this._mapStaticObjectNames(_visibilities);
  }

  protected _mapStaticObjectNames(visibilities: VisibilityDefinition[]) {
    return visibilities
      .map((collection) => collection.objects)
      .flat()
      .filter((objectName, index, names) => names.indexOf(objectName) === index)
      .map(cleanObjectName);
  }

  // public isStaticObject(objectName: string) {
  //   return this._staticObjectNames.includes(cleanObjectName(objectName));
  // }

  protected _reset() {
    this._objects = [];
    this._materials = [];
    this._sourceMaterials = [];
    this._data = [];
  }

  abstract setupObject(
    mesh: Mesh,
    material: MaterialT,
    setupLayers?: boolean
  ): void;

  abstract mapMaterial(mesh: Mesh, material: MaterialT, data: DataT): MaterialT;

  mapObject(object: Mesh, material: MaterialT) {
    return object;
  }

  filterMesh(mesh: Mesh, data: DataT, material = mesh.material): boolean {
    return this._staticObjectNames.includes(cleanObjectName(mesh.name));
  }

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

  public addMesh(mesh: Mesh, setupLayers = true): boolean {
    const data = this.getMeshData(mesh);
    const match = this.filterMesh(mesh, data); 
    const sourceMaterial = mesh.material as MaterialT;
    
    if (match) {
      const finalMesh = this.mapObject(mesh, sourceMaterial as MaterialT);
      if (this._addObject(finalMesh, data)) {
        let material = this.getCachedMaterial(mesh, sourceMaterial as MaterialT, data);

        if (material === null) {
          material = this.mapMaterial(
            finalMesh,
            finalMesh.material as MaterialT,
            data
          );
          this._addMaterial(material, sourceMaterial);
        } 
        
        finalMesh.material = material;
        this.setupObject(finalMesh, material, setupLayers);
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

  protected _addMaterial(material: MaterialT, sourceMaterial: MaterialT): boolean {
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
