export type VisibilityRelation = {
  collection: string;
  invert?: boolean;
}

export type VisibilityDefinition = {
  name:string;
  objects: string[];
}

export type BakeFormat = 'SDR' | 'HDR';


export enum BakeRenderLayer{
  Static = 1,
  Active = 2,
  // StaticLights = 3,
}
