#include <packing>

#include <convolution>

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 tDiffuseSize;
uniform Kernel blurKernel;


void main() {
  vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
  gl_FragColor = convolutionVec4(tDiffuse,tDiffuseSize,vUv,blurKernel);
}