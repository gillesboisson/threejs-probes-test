import { Texture } from 'three'
import {
} from '../type'
import { getCubemapPackCoords } from './getCubemapPackCoords'
import { unpackCubemaps } from './unpackCubemaps'
import { IrradianceProbeVolumeDefinition } from '../data'

export function generateProbeGridCubemaps(
  volumeDefinition: IrradianceProbeVolumeDefinition,
  image: HTMLImageElement
) {
  const res: Texture[] = []
  const nbCubemap =
    volumeDefinition.data.resolution[0] * volumeDefinition.data.resolution[1] * volumeDefinition.data.resolution[2]
  const mapCoords = getCubemapPackCoords(
    volumeDefinition.baking.cubemap_face_size,
    0,
    nbCubemap,
    volumeDefinition.baking.max_texture_size,
    6,
    1
  )

  return unpackCubemaps(image, mapCoords)
}


