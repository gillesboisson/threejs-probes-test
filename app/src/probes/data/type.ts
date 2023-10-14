import { IrradianceVolumeData } from "./IrradianceVolumeData";
import { ProbeVolumeDefinition, ProbeVolumeJSON } from "./ProbeVolumeDefinition";
import { ReflectionVolumeData } from "./ReflectionVolumeData";

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

export type AnyProbeVolumeJSON = ReflectionVolumeJSON | IrradianceVolumeJSON