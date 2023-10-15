import { LineBasicMaterial } from 'three';
import { IrradianceProbeMesh } from './IrradianceProbeMesh';
import { createWireframeMeshFromIrradianceVolume } from './meshHelpers';
import { IrradianceProbeVolume } from '../volume';
import { ProbeVolumeMeshGroup } from './ProbeVolumeMeshGroup';


export class IrradianceProbeVolumeMeshGroup extends ProbeVolumeMeshGroup<IrradianceProbeVolume> {
  constructor(volume: IrradianceProbeVolume) {
    super(volume);
    createWireframeMeshFromIrradianceVolume(
      volume,
      new LineBasicMaterial({ color: 11206400, linewidth: 1 }),
      this.influenceGroup
    );

    volume.probes.forEach((probe) => {
      this.probesGroup.add(new IrradianceProbeMesh(probe));
    });
  }
}
