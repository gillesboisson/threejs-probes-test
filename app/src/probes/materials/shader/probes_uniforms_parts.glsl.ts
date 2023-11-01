import {
  irradianceMapNames,
  ratioVar,
  reflectionLodVar,
  reflectionMapNames,
} from '../shaderConstants'

const commonUniforms = `
  uniform float envMapIntensity;
`

const irradianceUniforms = `
  float ${ratioVar('irradiance')}[MAX_IRRADIANCE_MAPS];

  ${irradianceMapNames.map((name) => `uniform samplerCube ${name};`).join('\n')}
`

const reflectionUniforms = `
  float ${ratioVar('reflection')}[MAX_REFLECTION_MAPS];
  float ${reflectionLodVar()}[MAX_REFLECTION_MAPS];

  
  ${reflectionMapNames.map((name) => `uniform samplerCube ${name};`).join('\n')}
`

export const vertexUniforms = `
  #if defined(PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER)
    ${commonUniforms}
    ${irradianceUniforms}
  #endif
`

export const fragmentUniforms = `

  ${commonUniforms}

  #ifndef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
    ${irradianceUniforms}
  #endif

  ${reflectionUniforms}

`
