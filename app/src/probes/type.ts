import { Probe } from './Probe'

export type ProbeType = 'irradiance' | 'reflection'
export type ProbeInfluenceType = 'BOX' | 'ELIPSOID'
export type ProbeRatio = [Probe, number]
