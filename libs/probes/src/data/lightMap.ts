import { VisibilityRelation } from './type';

export type LightMapPassDefinition = {
  use_pass_direct: boolean;
  use_pass_indirect: boolean;
  use_pass_diffuse: boolean;
  use_pass_glossy: boolean;
  use_pass_emit: boolean;
  
  use_pass_transmission: boolean;
};

export type LightMapDefinition = {
  map_size: number;
  type: 'COMBINED';
  name:string;
  grouped_bake: boolean;
  object_name: string;
  passes: LightMapPassDefinition;
  format: 'SDR' | 'HDR';
  uv_index: number;
  visibility: VisibilityRelation;
};

export type LightMapJSON = LightMapDefinition & {
  filename: string;
};
