import { Group } from 'three';
import { AnyProbeVolume } from '../volume';


export class ProbeVolumeMeshGroup<
  ProbeVolumeT extends AnyProbeVolume = AnyProbeVolume
> extends Group {
  readonly probesGroup: Group;
  readonly influenceGroup: Group;

  constructor(readonly probeVolume: ProbeVolumeT) {
    super();

    this.probesGroup = new Group();
    this.influenceGroup = new Group();

    this.add(this.probesGroup, this.influenceGroup);
  }
}
