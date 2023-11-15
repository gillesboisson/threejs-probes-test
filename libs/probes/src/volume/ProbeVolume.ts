import { Object3D, Box3, CubeTexture, Vector3 } from 'three';
import { Probe } from '../Probe';
import { AnyProbeVolumeBaking, AnyProbeVolumeData } from '../data';
import { ProbeVolumeProps } from '../props';
import { ProbeType, ProbeRatio } from '../type';
import { UseGetSuroundingProbes } from './type';

export abstract class ProbeVolume<
    DataT extends AnyProbeVolumeData,
    BakingT extends AnyProbeVolumeBaking,
    TypeT extends ProbeType,
    ProbeT extends Probe = Probe
  >
  extends Object3D
  implements UseGetSuroundingProbes
{
  protected _bounds = new Box3();

  readonly type: TypeT;
  readonly data: Readonly<DataT>;

  readonly clipStart: number;
  readonly clipEnd: number;

  readonly probes: Readonly<ProbeT>[] = [];

  needBoundsUpdate: boolean = true;
  readonly textures: CubeTexture[];

  constructor({
    transform,
    baking,
    data,
    render,
    textures,
    ...props
  }: ProbeVolumeProps<DataT, BakingT, TypeT>) {
    super();
    this.position.set(
      transform.position[0],
      transform.position[1],
      transform.position[2]
    );
    this.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
    this.rotation.set(
      transform.rotation[0],
      transform.rotation[1],
      transform.rotation[2]
    );

    this.name = props.name;
    this.type = props.probe_type;
    this.clipStart = render.clip_start;
    this.clipEnd = render.clip_end;

    this.data = data;
    this.textures = textures;
  }

  protected abstract computeBounds(): void;
  abstract getSuroundingProbes(
    position: Vector3,
    volumeRatio: number,
    result: ProbeRatio[],
    offset?: number
  ): number;

  abstract getGlobalRatio(position: Vector3): number;

  get bounds(): Box3 {
    if (this.needBoundsUpdate === true) {
      this.computeBounds();
      this.needBoundsUpdate = false;
    }
    return this._bounds;
  }
}

export type AnyProbeVolume = ProbeVolume<
  AnyProbeVolumeData,
  AnyProbeVolumeBaking,
  ProbeType,
  any
>;
