import { Group, Mesh, SphereGeometry, Vector3 } from 'three'
import { ProbeRatio, ProbeRatioLod } from '../type'
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  IrradianceProbeVolumeGroup,
  ReflectionProbeVolume,
  ReflectionProbeVolumeGroup,
} from '../volume'
import { IrradianceProbeDebugMaterial } from './IrradianceProbeDebugMaterial'
import { ReflectionProbeDebugMaterial } from './ReflectionProbeDebugMaterial'
import GUI from 'lil-gui'

const leftHalfSphereGeom = new SphereGeometry(1, 32, 32, 0, Math.PI)
const rightHalfSphereGeom = new SphereGeometry(1, 32, 32, Math.PI, Math.PI)
const sphereGeom = new SphereGeometry(1, 32, 32)

export class DynamicProbeDebugger extends Group {
  private _irradianceProbeRatio: ProbeRatio[] = []
  private _reflectionProbeRatio: ProbeRatioLod[] = []

  protected irradianceVolumes = new IrradianceProbeVolumeGroup()
  protected reflectionVolumes = new ReflectionProbeVolumeGroup()

  protected halfIrradianceMesh: Mesh<
    SphereGeometry,
    IrradianceProbeDebugMaterial
  >
  protected halfReflectionMesh: Mesh<
    SphereGeometry,
    ReflectionProbeDebugMaterial
  >
  protected irradianceMesh: Mesh<SphereGeometry, IrradianceProbeDebugMaterial>
  protected reflectionMesh: Mesh<SphereGeometry, ReflectionProbeDebugMaterial>

  protected _irradianceVisible = true
  protected _reflectionVisible = true
  irradianceProbeMeshMaterial: IrradianceProbeDebugMaterial
  reflexionProbeMeshMaterial: ReflectionProbeDebugMaterial

  protected _reflectionRoughness = 1

  get reflectionRoughness() {
    return this._reflectionRoughness
  }

  set reflectionRoughness(value: number) {
    if (value !== this._reflectionRoughness) {
      this._reflectionRoughness = value
      this.updateProbeRatio()
    }
  }

  get irradianceVisible() {
    return this._irradianceVisible
  }

  set irradianceVisible(value: boolean) {
    if (value !== this._irradianceVisible) {
      this._irradianceVisible = value
      this.refreshVisibility()
    }
  }

  get reflectionVisible() {
    return this._reflectionVisible
  }

  set reflectionVisible(value: boolean) {
    if (value !== this._reflectionVisible) {
      this._reflectionVisible = value
      this.refreshVisibility()
    }
  }

  constructor(readonly probesVolumes: AnyProbeVolume[]) {
    super()
    probesVolumes
      .filter((v) => v instanceof IrradianceProbeVolume)
      .forEach((v) => {
        this.irradianceVolumes.addVolume(v as IrradianceProbeVolume)
      })

    probesVolumes
      .filter((v) => v instanceof ReflectionProbeVolume)
      .forEach((v) => {
        this.reflectionVolumes.addVolume(v as ReflectionProbeVolume)
      })

    this.irradianceProbeMeshMaterial = new IrradianceProbeDebugMaterial()
    this.reflexionProbeMeshMaterial = new ReflectionProbeDebugMaterial()

    this.halfIrradianceMesh = new Mesh(
      leftHalfSphereGeom,
      this.irradianceProbeMeshMaterial
    )
    this.halfReflectionMesh = new Mesh(
      rightHalfSphereGeom,
      this.reflexionProbeMeshMaterial
    )

    this.irradianceMesh = new Mesh(sphereGeom, this.irradianceProbeMeshMaterial)
    this.reflectionMesh = new Mesh(sphereGeom, this.reflexionProbeMeshMaterial)

    this.add(
      this.halfIrradianceMesh,
      this.halfReflectionMesh,
      this.irradianceMesh,
      this.reflectionMesh
    )

    this.updateProbeRatio()
  }

  gui(gui: GUI) {
    const debugFolder = gui.addFolder('Dynamic probe')
    debugFolder.add(this, 'irradianceVisible').name('Irradiance')
    debugFolder.add(this, 'reflectionVisible').name('Reflection')
    debugFolder
      .add(this, 'reflectionRoughness', 0, 1)
      .name('Reflection roughness')
      .step(0.01)
  }

  protected refreshVisibility() {
    this.halfIrradianceMesh.visible =
      this._irradianceVisible && this._reflectionVisible
    this.halfReflectionMesh.visible =
      this._irradianceVisible && this._reflectionVisible
    this.irradianceMesh.visible =
      this._irradianceVisible && !this._reflectionVisible
    this.reflectionMesh.visible =
      this._reflectionVisible && !this._irradianceVisible
  }

  protected updateProbeRatio() {
    this.irradianceVolumes.getSuroundingProbes(
      this.position,
      this._irradianceProbeRatio
    )

    this.reflectionVolumes.getSuroundingProbes(
      this.position,
      this._reflectionProbeRatio,
      [],
      this.reflectionRoughness
    )

    this.irradianceProbeMeshMaterial.updateProbeRatio(
      this._irradianceProbeRatio
    )
    this.reflexionProbeMeshMaterial.updateProbeRatio(this._reflectionProbeRatio)
  }

  updatePosition(position: Vector3) {
    this.position.copy(position)
    this.updateProbeRatio()
  }
}
