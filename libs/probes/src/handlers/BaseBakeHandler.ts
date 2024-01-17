import { Material, Mesh, Object3D } from 'three';
import { VisibilityDefinition } from '..';
import { cleanObjectName } from '../helpers';

export abstract class BaseBakeHandler<MaterialT extends Material, ObjectT extends Object3D> {
  protected _objects: ObjectT[] = [];
  protected _materials: MaterialT[] = [];
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

  public isStaticObject(objectName: string) {
    return this._staticObjectNames.includes(cleanObjectName(objectName));
  }

  protected _reset() {
    this._objects = [];
    this._materials = [];
  }

  abstract setupObject(mesh: Mesh, setupLayers?: boolean): boolean;
  abstract removeMesh(mesh: Mesh): void;

  protected _addMesh(mesh: ObjectT): boolean {
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

  protected _removeObject(mesh: ObjectT): boolean {
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
      return true;
    }
    return false;
  }
}
