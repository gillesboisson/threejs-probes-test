
export default /* glsl */`


#ifdef ENV_WORLDPOS

  vWorldPosition = worldPosition.xyz;

#else

  vec3 cameraToVertex;

  if ( isOrthographic ) {

    cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

  } else {

    cameraToVertex = normalize( worldPosition.xyz - cameraPosition );

  }

  vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );

  #ifdef ENVMAP_MODE_REFLECTION

    vReflect = reflect( cameraToVertex, worldNormal );

  #else

    vReflect = refract( cameraToVertex, worldNormal, refractionRatio );

  #endif
#endif

//ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
//  vProbeIrradiance = getIBLIrradiance( worldNormal );
//endif

`