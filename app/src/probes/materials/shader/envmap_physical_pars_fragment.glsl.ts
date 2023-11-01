
import { fragmentFunctions } from './probes_func_parts.glsl'

// defined in envmap_common_pars_fragment
export default /* glsl */`
  #ifndef USE_PROBES
    #include <envmap_physical_pars_fragment>
  #endif
`