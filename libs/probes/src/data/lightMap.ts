import { Texture } from 'three';
import { cleanObjectName } from '../helpers';
import { BakeFormat, VisibilityDefinition, VisibilityRelation } from './type';

// export type LightMapPassDefinition = {
//   use_pass_direct: boolean;
//   use_pass_indirect: boolean;
//   use_pass_diffuse: boolean;
//   use_pass_glossy: boolean;
//   use_pass_emit: boolean;
//   use_pass_color: boolean;

//   use_pass_transmission: boolean;
// };

export type LightMapType = 'COMBINED' | 'DIFFUSE';

export type LightMapPass =
  | 'DIRECT'
  | 'INDIRECT'
  | 'DIFFUSE'
  | 'GLOSSY'
  | 'EMIT'
  | 'COLOR'
  | 'TRANSMISSION';

export type LightMapCoreDefinition<Object3DT> = {
  objects: Object3DT[];
};

// export type LightMapPresetCoreDefinition<MapT> = {
//   map_size: number;
//   type: LightMapType;
//   name: string;
//   // group_index: number;
//   grouped_bake: boolean;
//   passes: LightPass;
//   format: BakeFormat;
//   uv_index: number;
//   maps: MapT;
// };

export type LightMapJSON = LightMapCoreDefinition<string> & {
  filename: string;
};

export type LightMapDefinition<Object3DT = string> =
  LightMapCoreDefinition<Object3DT> & {
    map: Texture;
  };

export type LightMapGroupCoreDefinition<LightMapT, VisibilityT> = {
  map_size: number;
  type: LightMapType;
  name: string;
  // group_index: number;
  grouped_bake: boolean;
  passes: LightMapPass;
  format: BakeFormat;
  uv_index: number;
  maps: LightMapT[];
  visibility: VisibilityT;
};

export type LightMapGroupDefinition = LightMapGroupCoreDefinition<
  LightMapDefinition,
  VisibilityDefinition
>;

export type LightMapGroupJSON = LightMapGroupCoreDefinition<
  LightMapJSON,
  VisibilityRelation
>;


// export type LightMapGroupDefinition = LightMapPresetCoreDefinition & {
//   object_names: string;
//   visibility: VisibilityDefinition;
// };

// export type LightMapGroupJSON = LightMapGroupDefinition & {
//   filename: string;
// };

// export function groupLightMap(
//   lightmapsData: LightMapPresetJSON[],
//   visibilityDefinitions: VisibilityDefinition[]
// ): LightMapGroupJSON[] {
//   const groups: LightMapGroupJSON[] = [];

//   for (const lightmap of lightmapsData) {
//     let group = groups.find(
//       (g) => g.name === lightmap.name && g.group_index === lightmap.group_index
//     );

//     const objectName = cleanObjectName(lightmap.object_name);

//     if (group) {
//       group.object_names.push(objectName);
//     } else {
//       const visibility = visibilityDefinitions.find(
//         (v) => v.name === lightmap.visibility.collection
//       );
//       if (!visibility) {
//         throw new Error(
//           `Could not find visibility definition for ${lightmap.visibility.collection}`
//         );
//       }
//       group = {
//         ...lightmap,
//         visibility,
//         object_names: [objectName],
//       };
//       delete (group as any).object_name;
//       groups.push(group);
//     }
//   }

//   return groups;
// }
