import { maxIrradianceMaps } from '../shaderConstants'
import { fragmentFunctions } from './probes_func_parts.glsl'
import { fragmentUniforms } from './probes_uniforms_parts.glsl'
import { varying } from './probes_varying_parts.glsl'

export default /* glsl */ `
  
  #ifdef USE_PROBES
    ${fragmentUniforms}
    ${varying}
    ${fragmentFunctions}

  #else
  // fallback to environment map
  #include <envmap_common_pars_fragment>
  #endif  
`