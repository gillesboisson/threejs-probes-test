import { SphereGeometry, Mesh } from 'three';
import { IrradianceProbeMeshMaterial } from './IrradianceProbeMeshMaterial';
import { probeMeshGeom } from './ProbeMesh';
import { Probe } from '../type';


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
