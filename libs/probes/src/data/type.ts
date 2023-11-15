// import { GlobalEnvVolumeData } from './GlobalEnvVolumeData'
// import { IrradianceVolumeData } from './IrradianceVolumeData'
// import {
//   ProbeVolumeDefinition,
//   ProbeVolumeJSON,
// } from './ProbeVolumeDefinition'
// import { ReflectionVolumeData } from './ReflectionVolumeData'

// export type AnyProbeVolumeData = ReflectionVolumeData | IrradianceVolumeData

// export type ReflectionVolumeDefinition = ProbeVolumeDefinition<
//   ReflectionVolumeData,
//   'reflection'
// >
// export type IrradianceVolumeDefinition = ProbeVolumeDefinition<
//   IrradianceVolumeData,
//   'irradiance'
// >

// export type GlobalEnvVolumeDefinition = ProbeVolumeDefinition<
//   GlobalEnvVolumeData,
//   'global'
// >

// export type AnyProbeVolumeDefinition =
//   | ReflectionVolumeDefinition
//   | IrradianceVolumeDefinition

// export type ReflectionVolumeJSON = ProbeVolumeJSON<
//   ReflectionVolumeData,
//   'reflection'
// >
// export type IrradianceVolumeJSON = ProbeVolumeJSON<
//   IrradianceVolumeData,
//   'irradiance'
// >

// export type AnyProbeVolumeJSON = ReflectionVolumeJSON | IrradianceVolumeJSON
// export type GlobalEnvJSON = GlobalEnvVolumeDefinition & {
//   irradiance_file: string
//   reflectance_file: string
// }
