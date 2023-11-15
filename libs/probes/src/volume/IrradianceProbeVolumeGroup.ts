import { IrradianceProbeVolumeBaking, IrradianceProbeVolumeData } from '../data';
import { IrradianceProbeVolume } from './IrradianceProbeVolume';
import { ProbeVolumeGroup } from './ProbeVolumeGroup';

export class IrradianceProbeVolumeGroup extends ProbeVolumeGroup<
  IrradianceProbeVolume,
  IrradianceProbeVolumeData,
  IrradianceProbeVolumeBaking,
  'irradiance'
> {}
