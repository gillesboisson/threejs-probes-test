import {
  irradianceMapNames,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from '../shaderConstants'

const commonUniforms = `
  uniform float probesIntensity;
`

const irradianceUniforms = `
  #ifdef USE_RATIO_IRRADIANCE_PROBE
  uniform float ${ratioVar('irradiance')}[MAX_IRRADIANCE_MAPS];
  ${irradianceMapNames.map((name) => `uniform samplerCube ${name};`).join('\n')}
  #endif
  #ifdef USE_STATIC_IRRADIANCE_PROBE
  uniform samplerCube staticIrradianceProbeMap;
  #endif

`

const reflectionUniforms = `
  #ifdef USE_RATIO_REFLECTION_PROBE
  uniform float ${ratioVar('reflection')}[MAX_REFLECTION_MAPS];
  uniform float ${reflectionLodVar()}[MAX_REFLECTION_MAPS_DATA];

  
  ${reflectionMapNames.map((name) => `uniform samplerCube ${name};`).join('\n')}

  #endif
  #ifdef USE_STATIC_REFLECTION_PROBE
  uniform vec3 staticReflectionLod;
  uniform samplerCube staticReflectionProbeMap;
  #endif
`


export const vertexUniforms = ``



export const fragmentUniforms = `
  ${commonUniforms}
  ${irradianceUniforms}
  ${reflectionUniforms}
`
