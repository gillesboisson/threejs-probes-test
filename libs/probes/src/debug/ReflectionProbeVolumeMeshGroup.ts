import { LineBasicMaterial } from 'three';
import { ReflectionProbeMesh } from './ReflectionProbeMesh';
import { createWireframeMeshFromReflectionProbe } from './meshHelpers';
import { ReflectionProbeVolume } from '../volume';
import { ProbeVolumeMeshGroup } from './ProbeVolumeMeshGroup';


export class ReflectionProbeVolumeMeshGroup extends ProbeVolumeMeshGroup<ReflectionProbeVolume> {
  constructor(volume: ReflectionProbeVolume) {
    super(volume);
    createWireframeMeshFromReflectionProbe(
      volume,
      new LineBasicMaterial({ color: 65450, linewidth: 1 }),
      this.influenceGroup
    );

    volume.probes.forEach((probe) => {
      this.probesGroup.add(new ReflectionProbeMesh(probe));
    });
  }
}
