import { Group } from 'three';
import { GlobalEnvVolume } from '../volume/GlobalEnvVolume';
import { IrradianceProbeMesh } from './IrradianceProbeMesh';
import { ReflectionProbeMesh } from './ReflectionProbeMesh';


export class GlobalEnvMesh extends Group {
  readonly reflectionMesh: ReflectionProbeMesh;
  readonly irradianceMesh: IrradianceProbeMesh;




  constructor(volume: GlobalEnvVolume) {
    super();

    this.reflectionMesh = new ReflectionProbeMesh(volume.reflectionCubeProbe);
    this.irradianceMesh = new IrradianceProbeMesh(volume.irradianceCubeProbe);

    this.reflectionMesh.scale.setScalar(1)
    this.irradianceMesh.position.y += 1;



    this.add(this.reflectionMesh, this.irradianceMesh);

    this.position.copy(volume.position);
  }
}
