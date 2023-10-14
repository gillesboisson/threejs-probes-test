import { CubeTexture } from "three"
import { ProbeVolumeDefinition, ReflectionVolumeData, IrradianceVolumeData } from "./data"
import { ProbeType } from "./type"

export type ProbeVolumeProps<
  DataT,
  TypeT extends ProbeType
> = ProbeVolumeDefinition<DataT, TypeT> & {
  textures: CubeTexture[]
}

export type ReflectionVolumeProps = ProbeVolumeProps<
  ReflectionVolumeData,
  'reflection'
>
export type IrradianceVolumeProps = ProbeVolumeProps<
  IrradianceVolumeData,
  'irradiance'
>

export type AnyProbeVolumeProps = ReflectionVolumeProps | IrradianceVolumeProps