import { IUniform } from 'three'

export const maxIrradianceMaps = 9
export const maxReflectionMaps = 4
// export const computeRadianceInVertex = false

export const defines = {
  MAX_IRRADIANCE_MAPS: maxIrradianceMaps,
  MAX_REFLECTION_MAPS: maxReflectionMaps,
  USE_PROBES: true,
  // PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER: computeRadianceInVertex,
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

// export const materialUniforms: Record<string, IUniform> = {}
// irradianceMapNames.forEach((name) => {
//   materialUniforms[name] = { value: null }
// })
// reflectionMapNames.forEach((name) => {
//   materialUniforms[name] = { value: null }
// })

// materialUniforms[ratioVar('irradiance')] = {
//   value: new Float32Array(maxIrradianceMaps),
// }
// materialUniforms[ratioVar('reflection')] = {
//   value: new Float32Array(maxReflectionMaps),
// }
// materialUniforms[reflectionLodVar()] = { value: new Float32Array(maxReflectionMaps) }
