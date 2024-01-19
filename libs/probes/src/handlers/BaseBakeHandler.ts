import { Material, Mesh, Object3D } from 'three';
import { VisibilityDefinition } from '../data';

import { cleanObjectName } from '../helpers';
import { HasObjectMapper } from '../type';

export abstract class BaseBakeHandler<MaterialT extends Material>
  implements HasObjectMapper
{
  protected _objects: Object3D[] = [];
  protected _materials: MaterialT[] = [];
  protected _sourceMaterials: MaterialT[] = [];

  protected _staticObjectNames: string[];

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
  }

  abstract setupObject(
    mesh: Mesh,
    material: MaterialT,
    setupLayers?: boolean
  ): void;

  abstract mapMaterial(mesh: Mesh, material: MaterialT): MaterialT;

  mapObject(object: Mesh, material: MaterialT) {
    return object;
  }

  filterMesh(mesh: Mesh, material = mesh.material): boolean {
    return this._staticObjectNames.includes(cleanObjectName(mesh.name));
  }

  public removeMesh(mesh: Mesh): void {
    if (this._removeObject(mesh)) {
      this._removeMaterial(mesh.material as MaterialT);
    }
  }

  public addMesh(mesh: Mesh, setupLayers = true): boolean {
    const match = this.filterMesh(mesh);

    if (match) {
      const finalMesh = this.mapObject(mesh, mesh.material as MaterialT);
      if (this._addObject(finalMesh)) {
        let material = null;
        if (
          this._sourceMaterials.indexOf(finalMesh.material as MaterialT) === -1
        ) {
          material = this.mapMaterial(
            finalMesh,
            finalMesh.material as MaterialT
          );
          this._addMaterial(material);
        } else {
          material = finalMesh.material as MaterialT;
        }

        this.setupObject(finalMesh, material, setupLayers);
        finalMesh.material = material;
      }
    }

    return match;
  }

  protected _addObject(mesh: Object3D): boolean {
    if (!this._objects.includes(mesh)) {
      this._objects.push(mesh);
      return true;
    }

    return false;
  }

  protected _addMaterial(material: MaterialT): boolean {
    if (!this._materials.includes(material)) {
      this._materials.push(material);
      return true;
    }

    return false;
  }

  protected _removeObject(mesh: Object3D): boolean {
    const index = this._objects.indexOf(mesh);
    if (index > -1) {
      this._objects.splice(index, 1);
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
