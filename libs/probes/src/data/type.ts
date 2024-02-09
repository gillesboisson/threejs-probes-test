export type VisibilityRelation = {
  collection: string;
  invert?: boolean;
};

export type VisibilityProbeMode =
  | 'NONE'
  | 'ENV'
  | 'STATIC'
  | 'DYNAMIC'
  | 'MANUAL';


export type VisibilityDefinition = {
  name: string;
  layer_bit_mask: null | number;
  baked_by_probes: string[];
  baked_by_light_maps: string[];
};

export type BakeFormat = 'SDR' | 'HDR';

export enum BakeRenderLayer {
  Static = 1,
  Active = 2,
  AO = 3,
  Shadows = 16,
  // StaticLights = 3,
}
