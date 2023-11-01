import aomap_fragment from './shader/aomap_fragment.glsl'
import envmap_common_pars_fragment from './shader/envmap_common_pars_fragment.glsl'
import envmap_fragment from './shader/envmap_fragment.glsl'
import envmap_pars_fragment from './shader/envmap_pars_fragment.glsl'
import envmap_pars_vertex from './shader/envmap_pars_vertex.glsl'
import envmap_physical_pars_fragment from './shader/envmap_physical_pars_fragment.glsl'
import envmap_vertex from './shader/envmap_vertex.glsl'
import lights_fragment_maps from './shader/lights_fragment_maps.glsl'
import worldpos_vertex from './shader/worldpos_vertex.glsl'
import common_vertex from './shader/probes_common_vertex.glsl'

// chunks are implemented in order to override three js env map handling as probes are made to replace them
// all probes chunks prefixed envmap meant to replace behaviour for shader with USE_PROBES defined
// special case like aomap are explained in the implementation it self
const probesMaterialShaderChunk = {
  aomap_fragment,
  envmap_common_pars_fragment,
  envmap_fragment,
  envmap_pars_fragment,
  envmap_pars_vertex,
  envmap_physical_pars_fragment,
  envmap_vertex,
  lights_fragment_maps,
  worldpos_vertex,
}

export const probesMaterialFragmentShaderChunk = {
  ...probesMaterialShaderChunk,
}

export const probesMaterialVertexShaderChunk = {
  // as there no envmap_common_pars_vertex, probes vertex common is added to three js common
  common: common_vertex,
  ...probesMaterialShaderChunk,
}
