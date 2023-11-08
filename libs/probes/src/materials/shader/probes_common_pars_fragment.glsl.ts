import { fragmentFunctions } from './probes_func_parts.glsl'
import { fragmentUniforms } from './probes_uniforms_parts.glsl'
import { varying } from './probes_varying_parts.glsl'

export default /* glsl */ `
${fragmentUniforms}
${varying}
${fragmentFunctions}
`