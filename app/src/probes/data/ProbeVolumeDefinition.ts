import { ProbeType } from '../type'

export type EnvironmentVolumeDefinition = {
  position: [number, number, number]
  type: 'global'
}



export type ProbeVolumeDefinition<DataT, TypeT extends ProbeType> = {
  name: string
  cubemap_size: number
  texture_size: number
  type: TypeT
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
  clip_start: number
  clip_end: number
  data: DataT
}

export type ProbeVolumeJSON<
  DataT,
  TypeT extends ProbeType
> = ProbeVolumeDefinition<DataT, TypeT> & {
  file: string
}
