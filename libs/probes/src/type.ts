import { Probe } from './Probe'

export type ProbeType = 'irradiance' | 'reflection' | 'global'
export type ProbeInfluenceType = 'BOX' | 'ELIPSOID'
export type ProbeRatio = [Probe, number, ...any]
export type ProbeRatioLod = [Probe, number, number]
