#include <packing>

#include <convolution>




varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tPalette;
uniform float cameraNear;
uniform vec2 tDiffuseSize;
uniform float cameraFar;
uniform Kernel lightBlurKernel;

const float spriteRatio = 0.5;
const float lightRatio = 1.0 - spriteRatio;

void main() {
  vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
  vec3 normal = texture2D( tNormal, vUv ).rgb;
  float depth = 1.0 - texture2D( tDepth, vUv ).x;;
  
  
  float lightIntent = diffuse.r * diffuse.g;



  // even pixel only
  // if(mod((gl_FragCoord.x + gl_FragCoord.y), 2.0) == 0.0){
  //   lightIntent = 1.0;
  // }


 
  // use lookup palette x: light level y: albedo color
  vec3 convLight = convolutionVec3(tDiffuse,tDiffuseSize,vUv,lightBlurKernel);

  vec3 color = texture2D( tPalette, vec2(convLight.r * convLight.g,diffuse.b+0.1) ).rgb;
  // vec3 lightColor = texture2D( tPalette, vec2(lightIntent,0.0) ).rgb;
  
  // diffuse.b * shadow;

  // gl_FragColor = vec4(vec3(depth),1.0);
  // gl_FragColor = vec4(normal,1.0);
  // gl_FragColor = vec4(color * spriteRatio + lightColor * lightRatio ,1.0);
  gl_FragColor = vec4(color ,1.0);



  // if(mod((gl_FragCoord.x + gl_FragCoord.y), 2.0) == 0.0){
  //    gl_FragColor = vec4(color ,1.0);
  // }else{
  //    gl_FragColor = vec4(lightColor,1.0);
  // }

}