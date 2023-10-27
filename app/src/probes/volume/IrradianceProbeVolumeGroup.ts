import { IrradianceVolumeData } from '../data';
import { IrradianceProbeVolume } from './IrradianceProbeVolume';
import { ProbeVolumeGroup } from './ProbeVolumeGroup';


export class IrradianceProbeVolumeGroup extends ProbeVolumeGroup<
  IrradianceProbeVolume, IrradianceVolumeData, 'irradiance'
> {
}
