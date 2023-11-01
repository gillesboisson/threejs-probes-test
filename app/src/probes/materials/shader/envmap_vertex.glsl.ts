// envmap is just ignored on if USE_PROBES is defined
// probes vertex implementation is added to <worldpos_vertex> in order to be integrated in all materials
// envmap_vertex is included in standard materials
export default /* glsl */`
  #ifndef USE_PROBES
  #include <envmap_vertex>
  #endif 
`