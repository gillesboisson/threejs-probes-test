// export * from './IrradianceVolumeData'
// export * from './ProbeVolumeDefinition'
// export * from './ReflectionVolumeData'
// export * from './type'

import { ProbeInfluenceType, ProbeType } from '../type';

export type EnvironmentVolumeDefinition = {
  position: [number, number, number];
  type: 'global';
};

export type ProbeVolumeTransformDefinition = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
};

export type ProbevolumeRenderDefinition = {
  clip_start: number;
  clip_end: number;
  map_size: number;
  cycle_samples_max: number;
  cycle_samples_min: number;
  cycle_time_limit: number;
};

export type ProbeVolumeDefinition<DataT, BakingT, TypeT extends ProbeType> = {
  name: string;
  probe_type: TypeT;
  transform: ProbeVolumeTransformDefinition;
  render: ProbevolumeRenderDefinition;

  baked_objects: string[];
  baking: BakingT;
  data: DataT;
};

export type ReflectionProbeVolumeData = {
  falloff: number;
  intensity: number;
  influence_type: ProbeInfluenceType;
  influence_distance: number;
};
export type ReflectionProbeVolumeBaking = {
  cubemap_face_size: number;
  start_roughness: number;
  level_roughness: number;
  nb_levels: number;
};

export type ReflectionProbeVolumeDefinition = ProbeVolumeDefinition<
  ReflectionProbeVolumeData,
  ReflectionProbeVolumeBaking,
  'reflection'
>;

export type ReflectionProbeVolumeJSON = ReflectionProbeVolumeDefinition & {
  file: string;
};

export type IrradianceProbeVolumeData = {
  falloff: number;
  intensity: number;
  influence_distance: number;
  resolution: [number, number, number];
};

export type IrradianceProbeVolumeBaking = {
  cubemap_face_size: number;
  max_texture_size: number;
};

export type IrradianceProbeVolumeDefinition = ProbeVolumeDefinition<
  IrradianceProbeVolumeData,
  IrradianceProbeVolumeBaking,
  'irradiance'
>;

export type IrradianceProbeVolumeJSON = IrradianceProbeVolumeDefinition & {
  file: string;
};

export type GlobalEnvProbeVolumeData = {};

export type GlobalEnvVolumeBaking = {
  irradiance: {
    cubemap_face_size: number;
    max_texture_size: number;
  };
  reflection: {
    cubemap_face_size: number;
    start_roughness: number;
    level_roughness: number;
    nb_levels: number;
  };
};


export type GlobalEnvProbeVolumeDefinition = ProbeVolumeDefinition<
  GlobalEnvProbeVolumeData,
  GlobalEnvVolumeBaking,
  'global'
>;

export type GlobalEnvProbeVolumeJSON = GlobalEnvProbeVolumeDefinition & {
  irradiance_file: string;
  reflection_file: string;
};

export type AnyProbeVolumeDefinition =
  | ReflectionProbeVolumeDefinition
  | IrradianceProbeVolumeDefinition
  | GlobalEnvProbeVolumeDefinition;

export type AnyProbeVolumeJSON =
  | ReflectionProbeVolumeJSON
  | IrradianceProbeVolumeJSON
  | GlobalEnvProbeVolumeJSON;

export type AnyProbeVolumeData =
  | ReflectionProbeVolumeData
  | IrradianceProbeVolumeData
  | GlobalEnvProbeVolumeData;

export type AnyProbeVolumeBaking =
  | ReflectionProbeVolumeBaking
  | IrradianceProbeVolumeBaking
  | GlobalEnvVolumeBaking;