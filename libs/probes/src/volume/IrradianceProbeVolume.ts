import { Box3, Matrix4, Vector3 } from 'three'
import { ProbeRatio } from '../type'
import { generateProbeGridPositions } from '../loader/generateProbeGridPositions'

import { Probe } from '../Probe'
import { IrradianceProbeVolumeBaking, IrradianceProbeVolumeData } from '../data'
import { IrradianceVolumeProps } from '../props'
import { ProbeVolume } from './ProbeVolume'

const normalizeToGridSpace = new Matrix4().multiply(
  new Matrix4().makeScale(0.5, 0, 0)
)
// .multiply(new Matrix4().makeTranslation(0.5, 0.5, 0.5))

export class IrradianceProbeVolume extends ProbeVolume<
  IrradianceProbeVolumeData,
  IrradianceProbeVolumeBaking,
  'irradiance',
  Probe
> {
  readonly influenceDistance: number

  readonly falloff: number
  readonly resolution: Vector3
  readonly probeRadius: Vector3
  readonly gridBounds = new Box3()

  private _tPosition = new Vector3()
  private _inverseMatrixWorld = new Matrix4()
  private _gridSpaceMatrix = new Matrix4()

  constructor(data: IrradianceVolumeProps) {
    super(data)

    this.resolution = new Vector3(
      data.data.resolution[0],
      data.data.resolution[1],
      data.data.resolution[2]
    )

    this.influenceDistance = data.data.influence_distance

    this.falloff = data.data.falloff

    this.probeRadius = new Vector3(
      (this.scale.x * 2) / this.resolution.x,
      (this.scale.y * 2) / this.resolution.y,
      (this.scale.z * 2) / this.resolution.z
    )
    this.buildGrid()
  }

  protected disposeProbes() {
    console.warn('disposeProbes not implemented')
  }

  updateMatrixWorld(force?: boolean): void {
    super.updateMatrixWorld(force)
    this._inverseMatrixWorld.copy(this.matrixWorld).invert()

    this._gridSpaceMatrix
      .copy(this.matrixWorld)
      .multiply(
        new Matrix4().makeTranslation(
          1 / this.resolution.x - 1,
          1 / this.resolution.y - 1,
          1 / this.resolution.z - 1
        )
      )
      .multiply(
        new Matrix4().makeScale(
          2 / this.resolution.x,
          2 / this.resolution.y,
          2 / this.resolution.z
        )
      )
      .invert()
  }

  protected buildGrid() {
    if (this.probes.length > 0) {
      this.disposeProbes()
      this.probes.length = 0
    }

    const positions = generateProbeGridPositions(this.resolution)
    this.updateMatrixWorld()

    for (let i = 0; i < positions.length; i++) {
      this.probes.push({
        position: positions[i].applyMatrix4(this.matrixWorld),
        texture: this.textures[i],
        type: 'irradiance',
      })
    }
  }

  getGlobalRatio(position: Vector3): number {
    const bounds = this.bounds
    const influenceDistance = this.influenceDistance

    if (bounds.containsPoint(position)) {
      const tPosition = this._tPosition
        .copy(position)
        .applyMatrix4(this._inverseMatrixWorld)

      const ratioX =
        1 -
        Math.max(
          0,
          Math.min(1, (Math.abs(tPosition.x) - 1) / influenceDistance)
        )

      const ratioY =
        1 -
        Math.max(
          0,
          Math.min(1, (Math.abs(tPosition.y) - 1) / influenceDistance)
        )

      const ratioZ =
        1 -
        Math.max(
          0,
          Math.min(1, (Math.abs(tPosition.z) - 1) / influenceDistance)
        )

      return Math.min(ratioX, ratioY, ratioZ)
    }

    return 0
  }

  getSuroundingProbes(
    position: Vector3,
    volumeRatio: number,
    out: ProbeRatio[],
    offset = 0
  ): number {
    if (this.needBoundsUpdate === true) {
      this.computeBounds()
      this.needBoundsUpdate = false
    }
    
    const { x: resX, y: resY, z: resZ } = this.resolution
    const tPosition = this._tPosition
      .copy(position)
      .applyMatrix4(this._gridSpaceMatrix)

    const gridIndexX = Math.floor(tPosition.x)
    const gridIndexY = Math.floor(tPosition.y)
    const gridIndexZ = Math.floor(tPosition.z)

    const cellX = tPosition.x - gridIndexX
    const cellY = tPosition.y - gridIndexY
    const cellZ = tPosition.z - gridIndexZ

    const resYresZ = resY * resZ
    let totalRatio = 0
    let resultIndex = offset

    for (let iX = 0; iX < 2; iX++) {
      for (let iY = 0; iY < 2; iY++) {
        for (let iZ = 0; iZ < 2; iZ++) {
          const cCellIndexX = gridIndexX + iX
          const cCellIndexY = gridIndexY + iY
          const cCellIndexZ = gridIndexZ + iZ

          if (
            cCellIndexX < 0 ||
            cCellIndexX >= resX ||
            cCellIndexY < 0 ||
            cCellIndexY >= resY ||
            cCellIndexZ < 0 ||
            cCellIndexZ >= resZ
          ) {
            continue
          }

          const probeIndex =
            cCellIndexX * resYresZ + cCellIndexY * resZ + cCellIndexZ

          const probe = this.probes[probeIndex]

          const cCellX = iX === 0 ? 1 - cellX : cellX
          const cCellY = iY === 0 ? 1 - cellY : cellY
          const cCellZ = iZ === 0 ? 1 - cellZ : cellZ

          const ratio = cCellX * cCellY * cCellZ

          if (ratio !== 0) {
            totalRatio += ratio

            if (out.length > resultIndex) {
              out[resultIndex][0] = probe
              out[resultIndex][1] = ratio
            } else {
              out[resultIndex] = [probe, ratio]
            }

            resultIndex++
          }
        }
      }
    }

    for (let redIndex = offset; redIndex < resultIndex; redIndex++) {
      out[redIndex][1] /= totalRatio / volumeRatio
    }

    return resultIndex
  }

  computeBounds(): void {
    this.gridBounds.min.set(-1, -1, -1)

    this.gridBounds.max.set(1, 1, 1)

    this._bounds.copy(this.gridBounds)

    this.gridBounds.applyMatrix4(this.matrixWorld)

    this._bounds.min.addScalar(-this.influenceDistance)
    this._bounds.max.addScalar(this.influenceDistance)
    this._bounds.applyMatrix4(this.matrixWorld)
  }
}
