import {
  Group,
  Light, Object3D
} from 'three';
import { VisibilityDefinition } from '../data';


export class VisibilityLayersHandler {
  constructor() { }
  setupObjectLayers(visibilities: VisibilityDefinition[], objects: Object3D[]) {
    if (visibilities.length === 0) {
      return;
    }

    const findCollection = (name: string) => {
      return visibilities.find((collection) => collection.name === name);
    };

    const setObjectLayerMask = (object: Object3D) => {
      const objectCollections = object.userData?.bake_gi_export_json?.collections;

      if (objectCollections !== undefined && objectCollections.length > 0) {
        let useLayers = false;
        for (let collectionName of objectCollections) {
          const visibility = findCollection(collectionName);
          if (visibility) {
            if (visibility.layer_bit_mask !== null) {
              if (useLayers === false) {
                useLayers = true;
                object.layers.enableAll();
              }
              object.layers.mask &= visibility.layer_bit_mask;
            }
          }
        }
      }
    };

    objects.forEach(setObjectLayerMask);
  }
  setupObjectLayersGroup(
    objects: Object3D[],
    visibilities: VisibilityDefinition[] = null
  ): Group[] {
    const lightLayerCombinaisons: number[] = [];
    const meshLayerCombinaisons: number[] = [];

    if (visibilities !== null) {
      this.setupObjectLayers(visibilities, objects);
    }

    const lights = objects.filter(
      (object) => object instanceof Light
    ) as Light[];
    const otherObjects = objects.filter((object) => !(object instanceof Light));

    otherObjects.forEach((object: Object3D) => {
      // setObjectLayerMask(object);
      if (meshLayerCombinaisons.indexOf(object.layers.mask) === -1 &&
        object.layers.mask !== 0) {
        meshLayerCombinaisons.push(object.layers.mask);
      }
    });

    lights.forEach((object: Light) => {
      // setObjectLayerMask(object);
      if (lightLayerCombinaisons.indexOf(object.layers.mask) === -1 &&
        object.layers.mask !== 0) {
        lightLayerCombinaisons.push(object.layers.mask);
      }
    });

    const meshLightLayerCombinaisons: number[] = [];
    let meshWithNoLightMask: number = 0;

    for (let i = 0; i < meshLayerCombinaisons.length; i++) {
      let matchWithLight = false;
      const objectMask = meshLayerCombinaisons[i];

      for (let j = 0; j < lightLayerCombinaisons.length; j++) {
        const lightMask = lightLayerCombinaisons[j];
        const matchingMask = objectMask & lightMask;
        if (matchingMask !== 0) {
          matchWithLight = true;
          if (meshLightLayerCombinaisons.indexOf(matchingMask) === -1) {
            meshLightLayerCombinaisons.push(matchingMask);
          }
        }
      }

      if (!matchWithLight) {
        meshWithNoLightMask |= objectMask;
      }
    }

    const noLightGroup = new Group();
    noLightGroup.name = 'no_light';
    noLightGroup.layers.mask = meshWithNoLightMask;

    const groups: Group[] = [];

    const noLightGroupObjects = otherObjects.filter(
      (object) => (object.layers.mask & meshWithNoLightMask) !== 0
    );

    if (noLightGroupObjects.length > 0) {
      noLightGroup.add(...noLightGroupObjects);
    }

    groups.push(noLightGroup);

    for (let i = 0; i < meshLightLayerCombinaisons.length; i++) {
      const mask = meshLightLayerCombinaisons[i];
      const group = new Group();
      group.name = 'mask_' + mask.toString(2);
      group.layers.mask = mask;

      const matchOtherObjects = otherObjects.filter(
        (object) => (object.layers.mask & mask) === mask
      );

      if (matchOtherObjects.length > 0) {
        group.add(...matchOtherObjects);
      }

      const matchLights = objects.filter(
        (object) => object instanceof Light && (object.layers.mask & mask) === mask
      );

      if (matchLights.length > 0) {
        group.add(...matchLights);
      }

      groups.push(group);
    }

    return groups;
  }
}
