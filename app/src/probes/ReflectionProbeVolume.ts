import { Box3, Vector3 } from 'three'
import {
  ProbeInfluenceType,
  ProbeRatio,
  ReflectionVolumeData,
  ReflectionVolumeProps,
} from './type'
import { ProbeVolume } from './ProbeVolume'
import { Probe } from './Probe'

export class ReflectionProbeVolume extends ProbeVolume<
  ReflectionVolumeData,
  'reflection'
> {
  startRoughness: number
  levelRoughness: number
  intensity: number
  nbLevels: number
  falloff: number
  influenceType: ProbeInfluenceType
  influenceDistance: number

  protected influenceBounds = new Box3()
  readonly reflectionProbe: Probe

  constructor(props: ReflectionVolumeProps) {
    super(props)

    this.startRoughness = props.data.start_roughness
    this.levelRoughness = props.data.level_roughness
    this.intensity = props.data.intensity
    this.nbLevels = props.data.nb_levels
    this.falloff = props.data.falloff
    this.influenceType = props.data.influence_type
    this.influenceDistance = props.data.influence_distance

    if (this.influenceType === 'BOX') {
      this.influenceBounds.min.set(
        this.scale.x +
          (1 - this.falloff) * this.influenceDistance * this.scale.x,
        this.scale.y +
          (1 - this.falloff) * this.influenceDistance * this.scale.y,
        this.scale.z +
          (1 - this.falloff) * this.influenceDistance * this.scale.z
      )

      this.influenceBounds.max.set(
        this.scale.x + this.influenceDistance * this.scale.x,
        this.scale.y + this.influenceDistance * this.scale.y,
        this.scale.z + this.influenceDistance * this.scale.z
      )
    }

    if (!this.textures[0]) {
      throw new Error('No texture for reflection probe')
    }

    this.reflectionProbe = {
      position: this.position.clone(),
      texture: this.textures[0],
      type: 'reflection',
    }
    

    this.probes.push(this.reflectionProbe)
  }

  protected computeBounds(): void {
    const scale = this.scale.clone().multiplyScalar(this.influenceDistance)

    this._bounds.min.set(
      this.position.x - scale.x,
      this.position.y - scale.y,
      this.position.z - scale.z
    )

    this._bounds.max.set(
      this.position.x + scale.x,
      this.position.y + scale.y,
      this.position.z + scale.z
    )

  }

  getSuroundingProbes(
    position: Vector3,
    volumeRatio: number,
    result: ProbeRatio[],
    offset = 0
  ): number {
    if (result[offset] === undefined) {
      result[offset] = [this.reflectionProbe, volumeRatio]
    } else {
      result[offset][0] = this.reflectionProbe
      result[offset][1] = volumeRatio
    }

    return 1
  }
  getGlobalRatio(position: Vector3): number {
    if (this.bounds.containsPoint(position) === false) {
      return 0
    }

    let relativeX = Math.abs(position.x - this.position.x)
    let relativeY = Math.abs(position.y - this.position.y)
    let relativeZ = Math.abs(position.z - this.position.z)

    if (this.influenceType === 'BOX') {
      const influenceBoundsMin = this.influenceBounds.min
      const influenceBoundsMax = this.influenceBounds.max

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
    } else if (this.influenceType === 'ELIPSOID') {
      
      const scaledX = relativeX / this.scale.x / this.influenceDistance
      const scaledY = relativeY / this.scale.y / this.influenceDistance
      const scaledZ = relativeZ / this.scale.z / this.influenceDistance




      const scaledLength = Math.sqrt(
        scaledX * scaledX + scaledY * scaledY + scaledZ * scaledZ
      )


      const ratio = (
        1 -
        Math.max(
          0,
          Math.min(1, (scaledLength - this.falloff) / (1 - this.falloff))
        )
      ) 



      return ratio;
    } else {
      throw new Error(`Unknown influence type ${this.influenceType}`)
    }
  }
}
