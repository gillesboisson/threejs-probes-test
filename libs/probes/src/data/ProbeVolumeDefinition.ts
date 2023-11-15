// import { ProbeInfluenceType, ProbeType } from '../type';

// export type EnvironmentVolumeDefinition = {
//   position: [number, number, number];
//   type: 'global';
// };

// export type ProbeVolumeTransformDefinition = {
//   position: [number, number, number];
//   scale: [number, number, number];
//   rotation: [number, number, number];
// };

// export type ProbevolumeRenderDefinition = {
//   clip_start: number;
//   clip_end: number;
//   map_size: number;
//   cycle_samples_max: number;
//   cycle_samples_min: number;
//   cycle_time_limit: number;
// };

// export type ProbeVolumeDefinition<DataT, BakingT, TypeT extends ProbeType> = {
//   name: string;
//   probe_type: TypeT;
//   transform: ProbeVolumeTransformDefinition;
//   render: ProbevolumeRenderDefinition;

//   baked_objects: string[];
//   baking: BakingT;
//   data: DataT;
// };

// // export type ProbeVolumeJSON<
// //   DataT,
// //   BakingT,
// //   TypeT extends ProbeType
// // > = ProbeVolumeDefinition<DataT, BakingT, TypeT> & {
// //   // file: string;
// // };

// export type ReflectionVolumeData = {
//   falloff: number;
//   intensity: number;
//   influence_type: ProbeInfluenceType;
//   influence_distance: number;
// };
// export type ReflectionVolumeBaking = {
//   cubemap_face_size: number;
//   start_roughness: number;
//   level_roughness: number;
//   nb_levels: number;
// };

// export type ReflectionVolumeDefinition = ProbeVolumeDefinition<
//   ReflectionVolumeData,
//   ReflectionVolumeBaking,
//   'reflection'
// >;

// export type ReflectionVolumeJSON = ReflectionVolumeDefinition & {
//   file: string;
// }

// export type IrradianceVolumeData = {
//   falloff: number;
//   intensity: number;
//   influence_distance: number;
//   resolution: [number, number, number];
// };

// export type IrradianceVolumeBaking = {
//   cubemap_face_size: number;
//   max_texture_size: number;
// };


// export type IrradianceVolumeDefinition = ProbeVolumeDefinition<
//   IrradianceVolumeData,
//   IrradianceVolumeBaking,
//   'irradiance'
// >;

// export type IrradianceVolumeJSON = ReflectionVolumeDefinition & {
//   file: string;
// }

// export type GlobalEnvVolumeData = {};

// export type GlobalEnvVolumeBaking = {
//   irradiance: {
//     cubemap_face_size: number;
//     max_texture_size: number;
//   };
//   reflection: {
//     cubemap_face_size: number;
//     start_roughness: number;
//     level_roughness: number;
//     nb_levels: number;
//   };
// };

// export type GlobalEnvVolumeDefinition = ProbeVolumeDefinition<
//   GlobalEnvVolumeData,
//   GlobalEnvVolumeBaking,
//   'global'
// >;

// export type GlobalEnvJSON = GlobalEnvVolumeDefinition & {
//   irradiance_file: string;
//   reflection_file: string;
// };
