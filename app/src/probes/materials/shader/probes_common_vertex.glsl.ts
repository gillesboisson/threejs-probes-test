import { vertexFunctions } from "./probes_func_parts.glsl";
import { vertexUniforms } from "./probes_uniforms_parts.glsl";
import { varying } from "./probes_varying_parts.glsl";

export default /* glsl */`
  #include <common>

  #ifdef USE_PROBES
    

    #if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )

      #define ENV_WORLDPOS

    #endif

    ${vertexUniforms}
    
    #ifdef ENV_WORLDPOS
      
      varying vec3 vWorldPosition;

    #else

      varying vec3 vReflect;
      uniform float refractionRatio;

    #endif
    
    ${varying}

    ${vertexFunctions}

  #endif
`