export const maxIrradianceMaps = 8
export const maxReflectionMaps = 4
export const computeRadianceInVertex = false

export const defines = {
  MAX_IRRADIANCE_MAPS: maxIrradianceMaps,
  MAX_REFLECTION_MAPS: maxReflectionMaps,
  USE_PROBES: true,
  PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER: computeRadianceInVertex,
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


