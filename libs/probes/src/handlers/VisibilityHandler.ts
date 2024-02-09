import {
  BufferGeometry,
  Light,
  Material,
  Object3D,
  Object3DEventMap,
} from 'three';
import { BaseBakeSceneMapper } from './BakeSceneMapper';
import { BakeRenderLayer, VisibilityDefinition } from '../data';

export class VisibilityHandler {
  protected _objects: Object3D[] = [];
  protected _flatObjectNames: string[];

  constructor(protected _visibilities: VisibilityDefinition[]) {
    // this._flatObjectNames = this._visibilities
    //   .map((collection) => collection.objects)
    //   .flat()
    //   .filter(
    //     (objectName, index, names) => names.indexOf(objectName) === index
    //   );
  }

  reset() {
    this._objects = [];
  }

  filterMesh(mesh: Object3D): boolean {
    return this._flatObjectNames.includes(mesh.name);
  }

  addMesh(mesh: Object3D, setupLayers: boolean = true): boolean {
    const match = this.filterMesh(mesh);

    if(setupLayers){
      if(mesh instanceof Light){
        mesh.layers.disableAll();
        mesh.layers.enable(BakeRenderLayer.Active);
      }else{
        mesh.layers.disableAll();
        mesh.layers.enable(BakeRenderLayer.Static);

        if (mesh.castShadow){
          mesh.layers.enable(BakeRenderLayer.Shadows);
        }
      }

    }

    if (match && this._objects.indexOf(mesh) === -1) {
      this._objects.push(mesh);
    }
    return match;
  }

  removeMesh(mesh: Object3D): boolean {
    const index = this._objects.indexOf(mesh);
    if (index !== -1) {
      this._objects.splice(index, 1);
      return true;
    }
    return false;
  }

  // mapMaterial(mesh: Object3D<BufferGeometry<NormalBufferAttributes>, Material | Material[], Object3DEventMap>, material: Material): Material {
  //   throw new Error('Method not implemented.');
  // }
  // setData(data: VisibilityDefinition[]) {
  //   this._visibilities = data;
  //   this._reset();
  // }

  // setupObject(
  //   object: Object3D,
  //   material: Material,
  //   setupLayers: boolean = true,
  //   setupActiveObjectLayers = setupLayers
  // ): boolean {
  //   if (this.isStaticObject(object.name)) {
  //     if (this._addObject(object)) {
  //       if (setupLayers) {
  //         object.layers.disableAll();

  //         if (object instanceof Light) {
  //           object.layers.enable(BakeRenderLayer.Active);
  //         } else {
  //           object.layers.enable(BakeRenderLayer.Static);
  //         }
  //       }
  //       if (object instanceof Object3D) {
  //         this._addMaterial(object.material as Material);
  //       }

  //       return true;
  //     }
  //   } else {
  //     if (setupLayers && setupActiveObjectLayers) {
  //       object.layers.disableAll();
  //       object.layers.enable(BakeRenderLayer.Active);
  //     }
  //   }

  //   return false;
  // }
  // removeMesh(object: Object3D): void {
  //   throw new Error('Method not implemented.');
  // }
}
