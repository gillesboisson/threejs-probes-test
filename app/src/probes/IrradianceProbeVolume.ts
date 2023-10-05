import { Box3, Vector3 } from 'three'
import { IrradianceVolumeData, IrradianceVolumeProps, ProbeRatio } from './type'
import { generateProbeGridPositions } from './loader/generateProbeGridPositions'
import { ProbeVolume } from './ProbeVolume'

export class IrradianceProbeVolume extends ProbeVolume<
  IrradianceVolumeData,
  'irradiance'
> {
  readonly influenceDistance: number
  readonly clipStart: number
  readonly clipEnd: number
  readonly falloff: number
  readonly resolution: Vector3
  readonly probeRadius: Vector3
  readonly gridBounds = new Box3()

  protected influenceBounds = new Box3()

  constructor(data: IrradianceVolumeProps) {
    super(data)

    this.resolution = new Vector3(
      data.data.resolution[0],
      data.data.resolution[1],
      data.data.resolution[2]
    )

    this.influenceDistance = data.data.influence_distance
    this.clipStart = data.data.clip_start
    this.clipEnd = data.data.clip_end
    this.falloff = data.data.falloff

    this.probeRadius = new Vector3(
      (this.scale.x * 2) / this.resolution.x,
      (this.scale.y * 2) / this.resolution.y,
      (this.scale.z * 2) / this.resolution.z
    )

    this.influenceBounds.min.set(
      this.scale.x + (1 - this.falloff) * this.influenceDistance * this.scale.x,
      this.scale.y + (1 - this.falloff) * this.influenceDistance * this.scale.y,
      this.scale.z + (1 - this.falloff) * this.influenceDistance * this.scale.z
    )

    this.influenceBounds.max.set(
      this.scale.x + this.influenceDistance * this.scale.x,
      this.scale.y + this.influenceDistance * this.scale.y,
      this.scale.z + this.influenceDistance * this.scale.z
    )

    this.buildGrid()
  }

  protected disposeProbes() {
    console.warn('disposeProbes not implemented')
  }

  protected buildGrid() {
    if (this.probes.length > 0) {
      this.disposeProbes()
      this.probes.length = 0
    }
    const positions = generateProbeGridPositions(this.resolution, this.scale)

    for (let i = 0; i < positions.length; i++) {
      this.probes.push({
        position: positions[i].add(this.position),
        // infuence: probeInfuence,
        texture: this.textures[i],
        type: 'irradiance',
      })
    }
  }

  getGlobalRatio(position: Vector3): number {
    const bounds = this.bounds
    const influenceBoundsMin = this.influenceBounds.min
    const influenceBoundsMax = this.influenceBounds.max

    if (bounds.containsPoint(position)) {
      const relativeX = Math.abs(position.x - this.position.x)
      const relativeY = Math.abs(position.y - this.position.y)
      const relativeZ = Math.abs(position.z - this.position.z)

      const ratioX =
        1 -
        Math.max(
          0,
          Math.min(
            1,
            (relativeX - influenceBoundsMin.x) /
              (influenceBoundsMax.x - influenceBoundsMin.x)
          )
        )

      const ratioY =
        1 -
        Math.max(
          0,
          Math.min(
            1,
            (relativeY - influenceBoundsMin.y) /
              (influenceBoundsMax.y - influenceBoundsMin.y)
          )
        )

      const ratioZ =
        1 -
        Math.max(
          0,
          Math.min(
            1,
            (relativeZ - influenceBoundsMin.z) /
              (influenceBoundsMax.z - influenceBoundsMin.z)
          )
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

    const { x, y, z } = position
    const { x: resX, y: resY, z: resZ } = this.resolution
    const { x: radiusX, y: radiusY, z: radiusZ } = this.probeRadius
    // const nbProbes = this.textures.length

    const relativeX = x - this.gridBounds.min.x
    const relativeY = y - this.gridBounds.min.y
    const relativeZ = z - this.gridBounds.min.z

    const gridPosX = Math.max(-1, Math.min(resX - 1, relativeX / radiusX - 0.5))
    const gridPosY = Math.max(-1, Math.min(resY - 1, relativeY / radiusY - 0.5))
    const gridPosZ = Math.max(-1, Math.min(resZ - 1, relativeZ / radiusZ - 0.5))

    const gridIndexX = Math.floor(gridPosX)
    const gridIndexY = Math.floor(gridPosY)
    const gridIndexZ = Math.floor(gridPosZ)

    const cellX = 1 - Math.max(gridPosX - gridIndexX, 0)
    const cellY = 1 - Math.max(gridPosY - gridIndexY, 0)
    const cellZ = 1 - Math.max(gridPosZ - gridIndexZ, 0)

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

          const cCellX = iX === 1 ? 1 - cellX : cellX
          const cCellY = iY === 1 ? 1 - cellY : cellY
          const cCellZ = iZ === 1 ? 1 - cellZ : cellZ

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
    this.gridBounds.min.set(
      this.position.x - this.scale.x,
      this.position.y - this.scale.y,
      this.position.z - this.scale.z
    )

    this.gridBounds.max.set(
      this.position.x + this.scale.x,
      this.position.y + this.scale.y,
      this.position.z + this.scale.z
    )

    this._bounds.copy(this.gridBounds)

    const expand = new Vector3(
      this.scale.x * this.influenceDistance,
      this.scale.y * this.influenceDistance,
      this.scale.z * this.influenceDistance
    )
    this._bounds.min.sub(expand)
    this._bounds.max.add(expand)
  }
}
