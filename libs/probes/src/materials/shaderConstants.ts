import { IUniform } from 'three'

export const maxIrradianceMaps = 9
export const maxReflectionMaps = 4
// export const computeRadianceInVertex = false

export const defines = {
  MAX_IRRADIANCE_MAPS: maxIrradianceMaps,
  MAX_REFLECTION_MAPS: maxReflectionMaps,
  MAX_REFLECTION_MAPS_DATA: maxReflectionMaps * 3,
  USE_PROBES: true,
}

export function mapVar(
  type: 'irradiance' | 'reflection',
  index: string
): string {
  return `${type}Map${index}`
}
export function ratioVar(
  type: 'irradiance' | 'reflection',
  index: string = ''
): string {
  return `${type}Ratio${index !== '' ? `[${index}]` : ''}`
}

export function reflectionLodVar(index: string = ''): string {
  return `reflectionLod${index !== '' ? `[${index}]` : ''}`
}

export const irradianceMapNames: string[] = []

for (let i = 0; i < maxIrradianceMaps; i++) {
  irradianceMapNames.push(mapVar('irradiance', i.toString()))
}

export const reflectionMapNames: string[] = []

for (let i = 0; i < maxReflectionMaps; i++) {
  reflectionMapNames.push(mapVar('reflection', i.toString()))
}

