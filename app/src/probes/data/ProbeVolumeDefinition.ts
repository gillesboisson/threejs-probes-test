import { ProbeType } from '../type';


export type ProbeVolumeDefinition<DataT, TypeT extends ProbeType> = {
  name: string;
  cubemap_size: number;
  texture_size: number;
  type: TypeT;
  position: [number, number, number];
  scale: [number, number, number];
  data: DataT;
};

export type ProbeVolumeJSON<
  DataT,
  TypeT extends ProbeType
> = ProbeVolumeDefinition<DataT, TypeT> & {
  file: string
}
