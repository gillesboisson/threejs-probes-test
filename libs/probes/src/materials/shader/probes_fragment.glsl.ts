import { irradianceMapNames, ratioVar, reflectionLodVar, reflectionMapNames } from "../shaderConstants";

// reimplemented as reflection and irradiance are separated
export default /* glsl */`

#ifdef ENV_WORLDPOS

  vec3 cameraToFrag;

  if ( isOrthographic ) {

    cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

  } else {

    cameraToFrag = normalize( vWorldPosition - cameraPosition );

  }

  // Transforming Normal Vectors with the Inverse Transformation
  vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

  #ifdef PROBE_MODE_REFLECTION

    vec3 reflectVec = reflect( cameraToFrag, worldNormal );

  #else

    vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );

  #endif
  
#else

  vec3 reflectVec = vReflect;

#endif

//ifdef PROBES_GET_IRRADIANCE_IN_VERTEX_SHADER
//   outgoingLight += vProbeIrradiance;
//else
    outgoingLight += getIBLIrradiance( worldNormal );
//endif

vec3 reflectionEnvMapColor = getReflectionEnvColor( reflectVec );

#ifdef PROBE_BLENDING_MULTIPLY

  outgoingLight = mix( outgoingLight, outgoingLight * reflectionEnvMapColor, specularStrength * reflectivity );

#elif defined( PROBE_BLENDING_MIX )

  outgoingLight = mix( outgoingLight, reflectionEnvMapColor, specularStrength * reflectivity );

#elif defined( PROBE_BLENDING_ADD )

  outgoingLight += reflectionEnvMapColor * specularStrength * reflectivity;

#endif
    

`