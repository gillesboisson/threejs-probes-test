import { SphereGeometry, Mesh } from 'three';
import { Probe } from '../Probe';
import { IrradianceProbeMeshMaterial } from './IrradianceProbeMeshMaterial';
import { probeMeshGeom } from './ProbeMesh';


export class IrradianceProbeMesh extends Mesh<
  SphereGeometry, IrradianceProbeMeshMaterial
> {
  constructor(readonly probe: Probe) {
    const mat = new IrradianceProbeMeshMaterial();
    mat.envMap = probe.texture;
    super(probeMeshGeom, mat);
    this.position.copy(probe.position);
  }
}
