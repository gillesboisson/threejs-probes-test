import { Group } from 'three';
import { Probe } from '../Probe';
import { IrradianceProbeMesh } from './IrradianceProbeMesh';
import { ReflectionProbeMesh } from './ReflectionProbeMesh';


export class ProbeMeshGroup extends Group {
  constructor(readonly probes: Probe[]) {
    super();
    probes.forEach((probe) => {
      switch (probe.type) {
        case 'irradiance':
          this.add(new IrradianceProbeMesh(probe));
          break;
        case 'reflection':
          console.log('probe', probe);
          this.add(new ReflectionProbeMesh(probe));
          break;
        default:
          throw new Error('Unknown probe type');
      }
    });
  }
}
