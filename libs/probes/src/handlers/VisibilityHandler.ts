import {
  BufferGeometry,
  Light,
  Material,
  Mesh,
  NormalBufferAttributes,
  Object3D,
  Object3DEventMap,
} from 'three';
import { BaseBakeHandler } from './BaseBakeHandler';
import { BakeRenderLayer, VisibilityDefinition } from '../data';

export class VisibilityHandler extends BaseBakeHandler<Material, Object3D> {

  setData(data: VisibilityDefinition[]) {
    this._visibilities = data;
    this._reset();
  }

  setupObject(object: Object3D, setupLayers: boolean = true, setupActiveObjectLayers = setupLayers): boolean {
    if (this.isStaticObject(object.name)) {
      if (this._addMesh(object as Mesh)) {
        if (setupLayers) {
          object.layers.disableAll();
         

          if (object instanceof Light) {
            object.layers.enable(BakeRenderLayer.Active);
          }else{
            object.layers.enable(BakeRenderLayer.Static);

          }
        }
        if (object instanceof Mesh) {
          this._addMaterial(object.material as Material);
        }

        return true;
      }
    } else {
      if (setupLayers && setupActiveObjectLayers) {
        object.layers.disableAll();
        object.layers.enable(BakeRenderLayer.Active);
      }
    }

    return false;
  }
  removeMesh(object: Object): void {
    throw new Error('Method not implemented.');
  }
}
