import probes_fragment from './shader/probes_fragment.glsl'
import probes_pars_fragment from './shader/probes_pars_fragment.glsl'
import probes_common_pars_fragment from './shader/probes_common_pars_fragment.glsl'
import probes_aomap_fragment from './shader/probes_aomap_fragment.glsl'
import probes_worldpos_vertex from './shader/probes_worldpos_vertex.glsl'
import probes_lights_fragment_maps from './shader/probes_lights_fragment_maps.glsl'
import probes_common_vertex from './shader/probes_common_vertex.glsl'

import { ShaderChunk } from 'three'

function ssInclude(name: string) {
  return `#include <${name}>`
}

function ssIfDefInclude(
  constant: string,
  include: string,
  elseInclude: string = null
) {
  return `#ifdef ${constant}
    ${ssInclude(include)}
  ${
    elseInclude !== null
      ? `#else
    ${ssInclude(elseInclude)}`
      : ''
  }
  #endif`
}

function ssIfNdefInclude(constant: string, include: string) {
  return `#ifndef ${constant}
    ${ssInclude(include)}
 
  #endif`
}

const probesMaterialShunksOverrides = {
   // ignored if USE_PROBES is defined
  envmap_pars_vertex: ssIfNdefInclude('USE_PROBES', 'envmap_pars_vertex'),
  envmap_vertex: ssIfNdefInclude('USE_PROBES', 'envmap_vertex'),
  envmap_physical_pars_fragment: ssIfNdefInclude(
    'USE_PROBES',
    'envmap_physical_pars_fragment'
  ),
  envmap_pars_fragment: ssIfNdefInclude(
    'USE_PROBES',
    'envmap_pars_fragment'
  ),
  
  
  // custom implementation if USE_PROBES is defined
  envmap_common_pars_fragment: ssIfDefInclude(
    'USE_PROBES',
    'probes_common_pars_fragment',
    'envmap_common_pars_fragment'
  ),
  
  envmap_fragment: ssIfDefInclude(
    'USE_PROBES',
    'probes_fragment',
    'envmap_fragment'
  ),

  
  // reimplemented
  lights_fragment_maps: ssInclude('probes_lights_fragment_maps'),
  worldpos_vertex: ssInclude('probes_worldpos_vertex'),
  aomap_fragment: ssInclude('probes_aomap_fragment'),
}

export const probesMaterialFragmentChunksOverride = {
  ...probesMaterialShunksOverrides,
}

export const probesMaterialVertexChunksOverride = {
  // as there no envmap_common_pars_vertex, probes vertex common is added to three js common
  common: `${ssInclude('common')}
  #ifdef USE_PROBES
  ${ssInclude('probes_common_vertex')}
  #endif
  `,
  ...probesMaterialShunksOverrides,
}
ShaderChunk['probes_worldpos_vertex'] = probes_worldpos_vertex
ShaderChunk['probes_aomap_fragment'] = probes_aomap_fragment
ShaderChunk['probes_lights_fragment_maps'] = probes_lights_fragment_maps
ShaderChunk['probes_common_pars_fragment'] = probes_common_pars_fragment
ShaderChunk['probes_fragment'] = probes_fragment
ShaderChunk['probes_pars_fragment'] = probes_pars_fragment
ShaderChunk['probes_common_vertex'] = probes_common_vertex
