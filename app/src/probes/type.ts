import { CubeTexture } from 'three'
import { Probe } from './Probe'

export type ProbeVolumeDefinition<DataT, TypeT extends string> = {
  name: string
  cubemap_size: number
  texture_size: number
  type: TypeT
  position: [number, number, number]
  scale: [number, number, number]
  data: DataT
}

export type ProbeVolumeJSON<DataT, TypeT extends string> = ProbeVolumeDefinition<
  DataT,
  TypeT
> & {
  file: string
}

export type ProbeVolumeProps<
  DataT,
  TypeT extends string
> = ProbeVolumeDefinition<DataT, TypeT> & {
  textures: CubeTexture[]
}

export type ReflectionVolumeData = {
  start_roughness: number
  level_roughness: number
  nb_levels: number
  scale: [number, number, number]
  falloff: number
  radius: number
}

export type IrradianceVolumeData = {
  falloff: number
  resolution: [number, number, number]
  clip_start: number
  clip_end: number
  influence_distance: number
}

export type AnyProbeVolumeData = ReflectionVolumeData | IrradianceVolumeData

export type ReflectionVolumeDefinition = ProbeVolumeDefinition<
  ReflectionVolumeData,
  'reflection'
>
export type IrradianceVolumeDefinition = ProbeVolumeDefinition<
  IrradianceVolumeData,
  'irradiance'
>

export type AnyProbeVolumeDefinition =
  | ReflectionVolumeDefinition
  | IrradianceVolumeDefinition

export type ReflectionVolumeJSON = ProbeVolumeJSON<
  ReflectionVolumeData,
  'reflection'
>
export type IrradianceVolumeJSON = ProbeVolumeJSON<
  IrradianceVolumeData,
  'irradiance'
>

export type AnyProbeVolumeJSON =
  | ReflectionVolumeJSON
  | IrradianceVolumeJSON


export type ReflectionVolumeProps = ProbeVolumeProps<
  ReflectionVolumeData,
  'reflection'
>
export type IrradianceVolumeProps = ProbeVolumeProps<
  IrradianceVolumeData,
  'irradiance'
>

export type AnyProbeVolumeProps =
  | ReflectionVolumeProps
  | IrradianceVolumeProps


export type ProbeRatio = [Probe, number]