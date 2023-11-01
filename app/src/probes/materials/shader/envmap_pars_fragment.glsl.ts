import { fragmentUniforms } from "./probes_uniforms_parts.glsl";


export default /* glsl */`
#ifdef USE_PROBES
  uniform float reflectivity;

  #if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )

    #define ENV_WORLDPOS

  #endif

  #ifdef ENV_WORLDPOS

    varying vec3 vWorldPosition;
    uniform float refractionRatio;
  #else
    varying vec3 vReflect;
  #endif

#else
  // fallback to environment map
  #include <envmap_pars_fragment>
#endif
`