import { CubeTexture } from 'three';
import {
  ProbeVolumeDefinition,
  ReflectionProbeVolumeData,
  IrradianceProbeVolumeData,
  ReflectionProbeVolumeBaking,
  IrradianceProbeVolumeBaking,
} from './data';
import { ProbeType } from './type';

export type ProbeVolumeProps<
  DataT,
  BakingT,
  TypeT extends ProbeType
> = ProbeVolumeDefinition<DataT, BakingT, TypeT> & {
  textures: CubeTexture[];
};

export type ReflectionVolumeProps = ProbeVolumeProps<
  ReflectionProbeVolumeData,
  ReflectionProbeVolumeBaking,
  'reflection'
>;
export type IrradianceVolumeProps = ProbeVolumeProps<
  IrradianceProbeVolumeData,
  IrradianceProbeVolumeBaking,
  'irradiance'
>;

export type AnyProbeVolumeProps = ReflectionVolumeProps | IrradianceVolumeProps;
