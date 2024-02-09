import {
  irradianceMapNames,
  mapVar,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from '../shaderConstants';

const getIBLIrradiance = `
vec3 getIBLIrradiance( const in vec3 normal ) {

  vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
  vec3 envMapColor;
  #ifdef USE_RATIO_IRRADIANCE_PROBE
  ${irradianceMapNames
    .map((name, index) => {
      return `if (${ratioVar('irradiance', index.toString())} > 0.0) {
        envMapColor += texture(${name}, worldNormal).rgb * ${ratioVar(
        'irradiance',
        index.toString()
      )};
      }`;
      // return `envMapColor += texture(${name}, worldNormal).rgb * ${ratioVar('irradiance',index.toString())};`
    })
    .join('\n')};

  #endif
  #ifdef USE_STATIC_IRRADIANCE_PROBE
  envMapColor = texture(staticIrradianceProbeMap, worldNormal).rgb;
  #endif

  return PI * envMapColor.rgb * probesIntensity;

}
`;

const probeRoughnessToMip = `
  float probeRoughnessToMip(const in float roughness, float rMin, float rMax, float nbLevels) {
    float floatMipLevel = (roughness - rMin) / (rMax - rMin); 
    return floatMipLevel * nbLevels;
  }
`;

const getIBLRadiance = `
// roughness is not used as each probes has they own lod scale



vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

  vec3 reflectVec = reflect( - viewDir, normal );

  // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
  reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

  reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

  vec3 envMapColor;
  #ifdef USE_RATIO_REFLECTION_PROBE
  ${reflectionMapNames
    .map((name, index) => {
      return `if (${ratioVar('reflection', index.toString())} > 0.0) {
        float lod = probeRoughnessToMip(
          roughness, 
          ${reflectionLodVar((index * 3).toString())},
          ${reflectionLodVar((index * 3 + 1).toString())},
          ${reflectionLodVar((index * 3 + 2).toString())}
        );
        envMapColor += textureCubeLodEXT(${name}, reflectVec, lod).rgb * ${ratioVar('reflection', index.toString())};
      }`;
    })
    .join('\n')}

  #endif
  #ifdef USE_STATIC_REFLECTION_PROBE
    float lod = probeRoughnessToMip(
      roughness,
      staticReflectionLod.x,
      staticReflectionLod.y,
      staticReflectionLod.z
    );
    envMapColor = textureCubeLodEXT(staticReflectionProbeMap, reflectVec,lod).rgb;
  #endif

  return envMapColor * probesIntensity;
  
}`;

// copy as original without USE_ENVMAP condition
const getIBLAnisotropyRadiance = `
vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
  vec3 bentNormal = cross( bitangent, viewDir );
  bentNormal = normalize( cross( bentNormal, bitangent ) );
  bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

  return getIBLRadiance( viewDir, bentNormal, roughness );
}
`;

const getReflectionEnvColor = `
vec3 getReflectionEnvColor( const in vec3 reflectVec) {

  vec3 envMapColor;
  #ifdef USE_RATIO_REFLECTION_PROBE
  ${reflectionMapNames
    .map((name, index) => {
      return `if (${ratioVar('reflection', index.toString())} > 0.0) {
        envMapColor += textureCubeLodEXT(${name}, reflectVec, 0.0).rgb * ${ratioVar(
        'reflection',
        index.toString()
      )};
      }`;
    })
    .join('\n')}
  #endif
  #ifdef USE_STATIC_REFLECTION_PROBE
    envMapColor = textureCube(staticReflectionProbeMap, reflectVec).rgb;
  #endif
  return envMapColor * probesIntensity;
  
}`;

// const getIBLIrradianceFromVarying = `
// vec3 getIBLIrradiance( const in vec3 normal ) {
//   return vProbeRadiance;
// }
// `

export const vertexFunctions = ``;
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
  ${probeRoughnessToMip}
  ${getIBLIrradiance}
  #ifdef STANDARD
  ${getIBLRadiance}
  ${getIBLAnisotropyRadiance}
  #else
  ${getReflectionEnvColor}
  #endif
`;
