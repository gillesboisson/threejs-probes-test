import { Texture } from 'three'
import {
} from '../type'
import { ReflectionVolumeData } from '../data/ReflectionVolumeData'
import { getCubemapPackCoords } from './getCubemapPackCoords'
import { unpackCubemaps } from './unpackCubemaps'
import { IrradianceVolumeDefinition } from '../data'

export function generateProbeGridCubemaps(
  data: IrradianceVolumeDefinition,
  image: HTMLImageElement
) {
  const res: Texture[] = []
  const nbCubemap =
    data.data.resolution[0] * data.data.resolution[1] * data.data.resolution[2]
  const mapCoords = getCubemapPackCoords(
    data.cubemap_size,
    0,
    nbCubemap,
    data.texture_size,
    6,
    1
  )

  return unpackCubemaps(image, mapCoords)
}


