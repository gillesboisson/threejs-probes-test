import { Object3D, Box3, CubeTexture, Vector3 } from "three"
import { Probe } from "../Probe"
import { AnyProbeVolumeData } from "../data"
import { ProbeVolumeProps } from "../props"
import { ProbeType, ProbeRatio } from "../type"


export abstract class ProbeVolume<
  DataT extends AnyProbeVolumeData,
  TypeT extends ProbeType,
  ProbeT extends Probe = Probe,
> extends Object3D {
  protected _bounds = new Box3()

  readonly type: TypeT
  readonly data: Readonly<DataT>

  readonly clipStart: number
  readonly clipEnd: number

  readonly probes: Readonly<ProbeT>[] = []

  needBoundsUpdate: boolean = true
  readonly textures: CubeTexture[]

  constructor(props: ProbeVolumeProps<DataT, TypeT>) {
    super()
    this.position.set(props.position[0], props.position[1], props.position[2])
    this.scale.set(props.scale[0], props.scale[1], props.scale[2])
    this.rotation.set(props.rotation[0], props.rotation[1], props.rotation[2])
    
    this.name = props.name
    this.type = props.type
    this.clipStart = props.clip_start
    this.clipEnd = props.clip_end

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

export type AnyProbeVolume = ProbeVolume<AnyProbeVolumeData, ProbeType, any>
