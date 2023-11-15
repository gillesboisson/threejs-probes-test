import { CubeTexture, LinearFilter, LinearMipMapLinearFilter } from 'three'
import { getCubemapPackCoords } from './getCubemapPackCoords'
import { unpackCubemaps } from './unpackCubemaps'
import { ReflectionProbeVolumeDefinition } from '../data'

export function generateReflectionProbeCubemap(
  {data, baking}: ReflectionProbeVolumeDefinition,
  image: HTMLImageElement
) {
  const textureLevels: CubeTexture[] = []

  const nbLevels = baking.nb_levels

  for (let level = 0; level < nbLevels; level++) {
    const mapCoords = getCubemapPackCoords(
      baking.cubemap_face_size,
      level,
      1,
      image.width,
      4,
      2
    )

    textureLevels[level] = unpackCubemaps(image, mapCoords)[0]
  }

  // create roughness mipmaps from the first level
  const cubemap = textureLevels.shift() as CubeTexture
  cubemap.mipmaps = textureLevels
  cubemap.minFilter = LinearMipMapLinearFilter
  cubemap.magFilter = LinearFilter
  cubemap.generateMipmaps = false
  cubemap.needsUpdate = true

  return cubemap
}
