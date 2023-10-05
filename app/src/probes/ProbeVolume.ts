import { Box3, CubeTexture, Object3D, Vector3 } from 'three'
import {
  AnyProbeVolumeData,
  AnyProbeVolumeDefinition,
  ProbeRatio,
  ProbeType,
  ProbeVolumeProps,
} from './type'
import { Probe } from './Probe'

export abstract class ProbeVolume<
  DataT extends AnyProbeVolumeData,
  TypeT extends ProbeType
> extends Object3D {
  protected _bounds = new Box3()

  readonly type: TypeT
  readonly data: DataT

  readonly probes: Probe[] = []

  needBoundsUpdate: boolean = true
  readonly textures: CubeTexture[]

  constructor(props: ProbeVolumeProps<DataT, TypeT>) {
    super()
    this.position.set(props.position[0], props.position[1], props.position[2])
    this.scale.set(props.scale[0], props.scale[1], props.scale[2])
    this.name = props.name

    this.data = props.data
    this.textures = props.textures
  }

  protected abstract computeBounds(): void
  abstract getSuroundingProbes(
    position: Vector3,
    volumeRatio: number,
    result: ProbeRatio[],
    offset?: number
  ): number

  abstract getGlobalRatio(position: Vector3): number

  get bounds(): Box3 {
    if (this.needBoundsUpdate === true) {
      this.computeBounds()
      this.needBoundsUpdate = false
    }
    return this._bounds
  }
}

export type AnyProbeVolume = ProbeVolume<AnyProbeVolumeData, ProbeType>
