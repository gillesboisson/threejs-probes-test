import { cleanObjectName } from '../helpers';
import { BakeFormat, VisibilityDefinition, VisibilityRelation } from './type';

export type LightMapPassDefinition = {
  use_pass_direct: boolean;
  use_pass_indirect: boolean;
  use_pass_diffuse: boolean;
  use_pass_glossy: boolean;
  use_pass_emit: boolean;
  use_pass_color: boolean;

  use_pass_transmission: boolean;
};

export type LightMapType = 'COMBINED' | 'DIFFUSE';

export type LightMapCoreDefinition = {
  map_size: number;
  type: LightMapType;
  name: string;
  grouped_bake: boolean;
  passes: LightMapPassDefinition;
  format: BakeFormat;
  uv_index: number;
 
};

export type LightMapDefinition = LightMapCoreDefinition & {
  object_name: string;
  visibility: VisibilityRelation;
};

export type LightMapJSON = LightMapDefinition & {
  filename: string;
};

export type LightMapGroupDefinition = LightMapCoreDefinition & {
  object_names: string[];
  visibility: VisibilityDefinition;
};

export type LightMapGroupJSON = LightMapGroupDefinition & {
  filename: string;
};

export function groupLightMap(
  lightmapsData: LightMapJSON[],
  visibilityDefinitions: VisibilityDefinition[]
): LightMapGroupJSON[] {
  const groups: LightMapGroupJSON[] = [];

  for (const lightmap of lightmapsData) {
    let group = groups.find((g) => g.name === lightmap.name);

    const objectName = cleanObjectName(lightmap.object_name);

    if (group) {
      group.object_names.push(objectName);
    } else {
      const visibility = visibilityDefinitions.find(
        (v) => v.name === lightmap.visibility.collection
      );
      if (!visibility) {
        throw new Error(
          `Could not find visibility definition for ${lightmap.visibility.collection}`
        );
      }
      group = {
        ...lightmap,
        visibility,
        object_names: [objectName],
      };
      delete (group as any).object_name;
      groups.push(group);
    }
  }

  return groups;
}
