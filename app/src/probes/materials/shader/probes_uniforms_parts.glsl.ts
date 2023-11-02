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
  uniform float ${ratioVar('irradiance')}[MAX_IRRADIANCE_MAPS];

  ${irradianceMapNames.map((name) => `uniform samplerCube ${name};`).join('\n')}
`

const reflectionUniforms = `
  uniform float ${ratioVar('reflection')}[MAX_REFLECTION_MAPS];
  uniform float ${reflectionLodVar()}[MAX_REFLECTION_MAPS];

  
  ${reflectionMapNames.map((name) => `uniform samplerCube ${name};`).join('\n')}
`

// export const vertexUniforms = `
//   #ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
//     ${commonUniforms}
//     ${irradianceUniforms}
//   #endif
// `

export const vertexUniforms = ``

// export const fragmentUniforms = `

//   ${commonUniforms}

//   #ifndef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
//     ${irradianceUniforms}
//   #endif

//   ${reflectionUniforms}

// `

export const fragmentUniforms = `
  ${commonUniforms}
  ${irradianceUniforms}
  ${reflectionUniforms}
`
