import {
  irradianceMapNames,
  mapVar,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from '../shaderConstants'

const getIBLIrradiance = `
vec3 getIBLIrradiance( const in vec3 normal ) {

  vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
  vec3 envMapColor;

  ${irradianceMapNames
    .map((name, index) => {
      return `if (${ratioVar('irradiance', index.toString())} > 0.0) {
        envMapColor += texture(${name}, worldNormal).rgb * ${ratioVar(
        'irradiance',
        index.toString()
      )};
      }`
      // return `envMapColor += texture(${name}, worldNormal).rgb * ${ratioVar('irradiance',index.toString())};`
    })
    .join('\n')};

  return PI * envMapColor.rgb * probesIntensity;

}
`

const getIBLRadiance = `
// roughness is not used as each probes has they own lod scale
vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

  vec3 reflectVec = reflect( - viewDir, normal );

  // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
  reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

  reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
  /*
  vec4 envMapColor = ${reflectionMapNames
    .map((name, index) => {
      return `textureCubeLodEXT(${name}, reflectVec, ${reflectionLodVar(
        index.toString()
      )}) * ${ratioVar('reflection', index.toString())}`
    })
    .join('+\n\t\t\t')};
  */
  
  vec3 envMapColor;
  ${reflectionMapNames
    .map((name, index) => {
      return `if (${ratioVar('reflection', index.toString())} > 0.0) {
        envMapColor += textureCubeLodEXT(${name}, reflectVec, ${reflectionLodVar(
        index.toString()
      )}).rgb * ${ratioVar('reflection', index.toString())};
      }`
    })
    .join('\n')}
  

  return envMapColor * probesIntensity;
  
}`

// copy as original without USE_ENVMAP condition
const getIBLAnisotropyRadiance = `
vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
  vec3 bentNormal = cross( bitangent, viewDir );
  bentNormal = normalize( cross( bentNormal, bitangent ) );
  bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

  return getIBLRadiance( viewDir, bentNormal, roughness );
}
`

const getReflectionEnvColor = `
vec3 getReflectionEnvColor( const in vec3 reflectVec) {

  vec3 envMapColor;
  
  ${reflectionMapNames
    .map((name, index) => {
      return `if (${ratioVar('reflection', index.toString())} > 0.0) {
        envMapColor += textureCubeLodEXT(${name}, reflectVec, 0.0).rgb * ${ratioVar(
        'reflection',
        index.toString()
      )};
      }`
    })
    .join('\n')}

  return envMapColor * probesIntensity;
  
}`

const getIBLIrradianceFromVarying = `
vec3 getIBLIrradiance( const in vec3 normal ) {
  return vProbeRadiance;
}
`

export const vertexFunctions = ``
// export const vertexFunctions = `
//   #ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
//     ${getIBLIrradiance}
//   #endif
// `

// export const fragmentFunctions = `
//   #ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
//   ${getIBLIrradianceFromVarying}
//   #else
//   ${getIBLIrradiance}
//   #endif
//   #ifdef STANDARD
//   ${getIBLRadiance}
//   #else
//   ${getReflectionEnvColor}
//   #endif
// `

export const fragmentFunctions = `
  ${getIBLIrradiance}
  #ifdef STANDARD
  ${getIBLRadiance}
  ${getIBLAnisotropyRadiance}
  #else
  ${getReflectionEnvColor}
  #endif
`
