export const varying = /* glsl */`
  #ifdef PROBES_GET_IRRADIANCE_IN_VERTEX
    varying vec3 vProbeIrradiance
  #endif
`