import { ProbeInfluenceType } from '../type';


export type ReflectionVolumeData = {
  start_roughness: number;
  level_roughness: number;
  end_roughness: number;
  intensity: number;
  nb_levels: number;
  falloff: number;
  influence_type: ProbeInfluenceType;
  influence_distance: number;
};
