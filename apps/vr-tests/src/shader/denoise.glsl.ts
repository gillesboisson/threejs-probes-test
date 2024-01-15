export const vertexShader = `
// #version 300 es
precision highp float;


out vec2 vUv;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
in vec3 position;
in vec2 uv;


void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}`

export const fragmentShader = `
// #version 300 es
precision highp float;

float epsilon = 1e-7;

uniform sampler2D imageData;
uniform float uSigma;
uniform float uThreshold;
uniform float uKSigma;
uniform vec2 wSize;
uniform int whichTest;

out vec4 color;

#ifndef SQRT_OF_2PI
#define INV_SQRT_OF_2PI 0.39894228040143267793994605993439  // 1.0/SQRT_OF_2PI
#endif

#ifndef INV_PI
#define INV_PI 0.31830988618379067153776752674503
#endif

vec4 smartDeNoise(sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold) {
    float radius = round(kSigma*sigma);
    float radQ = radius * radius;
    float invSigmaQx2 = .5 / (sigma * sigma);      // 1.0 / (sigma^2 * 2.0)
    
    float invSigmaQx2PI = INV_PI * invSigmaQx2;    // // 1/(2 * PI * sigma^2)
    
    
    
    float invThresholdSqx2 = .5 / (threshold * threshold);     // 1.0 / (sigma^2 * 2.0)
    
    float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;   // 1.0 / (sqrt(2*PI) * sigma)
    
    
    vec4 centrPx = texture(tex, uv);
    float zBuff = 0.0;
    vec4 aBuff = vec4(0.0);
    vec2 size = vec2(textureSize(tex, 0));
    vec2 d;
    for (d.x = -radius; d.x <= radius; d.x++) {
        float pt = sqrt(radQ-d.x*d.x);       // pt = yRadius: have circular trend
        
        for (d.y = -pt; d.y <= pt; d.y++) {
            float blurFactor = exp( -dot(d, d) * invSigmaQx2 ) * invSigmaQx2PI;
            vec4 walkPx = texture(tex, uv+d/size);
            vec4 dC = walkPx-centrPx;
            float deltaFactor = exp( -dot(dC.rgb, dC.rgb) * invThresholdSqx2) * invThresholdSqrt2PI * blurFactor;
            zBuff += deltaFactor;
            aBuff += deltaFactor*walkPx;
        }

    }
    return aBuff/zBuff;
}
void main(void) {
    vec2 uv = vec2(gl_FragCoord.xy / wSize);

    color = smartDeNoise(imageData, vec2(uv.x, 1.0-uv.y), uSigma, uKSigma, uThreshold);
}


`
