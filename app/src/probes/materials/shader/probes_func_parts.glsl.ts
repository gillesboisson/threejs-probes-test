import {
  irradianceMapNames,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from '../shaderConstants'

const getIBLIrradiance = `
vec3 getIBLIrradiance( const in vec3 normal ) {

  vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

  vec4 envMapColor = ${irradianceMapNames
    .map((name, index) => {
      return `textureCube(${name}, worldNormal) * ${ratioVar(
        'irradiance',
        index.toString()
      )}`
    })
    .join('+\n\t\t\t')};

  return envMapColor.rgb * envMapIntensity;

}
`

const getIBLRadiance = `
// roughness is not used as each probes has they own lod scale
vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

  vec3 reflectVec = reflect( - viewDir, normal );

  // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
  reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

  reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

  vec4 envMapColor = ${reflectionMapNames
    .map((name, index) => {
      return `textureCubeLodEXT(${name}, reflectVec, ${reflectionLodVar(
        index.toString()
      )}) * ${ratioVar('reflection', index.toString())}`
    })
    .join('+\n\t\t\t')};

  return envMapColor.rgb * envMapIntensity;
  
}`

const getReflectionEnvColor = `
vec3 getReflectionEnvColor( const in vec3 reflectVec) {

  vec4 envMapColor = ${reflectionMapNames
    .map((name, index) => {
      return `textureCube(${name}, reflectVec) * ${ratioVar('reflection', index.toString())}`
    })
    .join('+\n\t\t\t')};

  return envMapColor.rgb * envMapIntensity;
  
}`

const getIBLIrradianceFromVarying = `
vec3 getIBLIrradiance( const in vec3 normal ) {
  return vProbeRadiance;
}
`

export const vertexFunctions = `
  #ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
    ${getIBLIrradiance}
  #endif
`

export const fragmentFunctions = `
  #ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
  ${getIBLIrradianceFromVarying}
  #else
  ${getIBLIrradiance}
  #endif
  #ifdef STANDARD
  ${getIBLRadiance}
  #else
  ${getReflectionEnvColor}
  #endif
`
