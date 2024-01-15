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
//------------------------------------------------------------------------------

//  Copyright (c) 2018-2020 Michele Morrone
//  All rights reserved.
//
//  https://michelemorrone.eu - https://BrutPitt.com
//
//  twitter: https://twitter.com/BrutPitt - github: https://github.com/BrutPitt
//
//  mailto:brutpitt@gmail.com - mailto:me@michelemorrone.eu
//  
//  This software is distributed under the terms of the BSD 2-Clause license
//------------------------------------------------------------------------------
// #line 14    //#version dynamically inserted


//This is an HEADER/INCLUDE file for RadialBlur2PassFrag.glsl and cmTextureFrag.glsl

#ifdef GL_ES
    #define saturate(v) clamp(v, vec3(0.0), vec3(1.0))
#else
    #ifndef saturate
        #define saturate(v) clamp(v, 0.0, 1.0)
    #endif
#endif

float epsilon = 1e-7;

// luminance

// float luminance(vec3 c) {
//     return dot(c, vec3(0.2990, 0.5870, 0.1140));
// }
// // linear rgb color luminance 
// float linearLum(vec3 c) {
//     return dot(c, vec3(0.2126, 0.7152, 0.0722));
// }
// vec3 toneMapping(vec3 c) {
//     return c/(vec3(1.0) + c);
// }
// // tonemap -> col = A * pow(col, G); -> x = A and y = G
// // A > 0, 0 < G < 1
// vec3 toneMapping(vec3 c, float A, float g) {
//     return A * pow(clamp(c, vec3(0.0), vec3(1.0)), vec3(g));
// }
// vec2 contrastHSL(vec2 c, float contrast) {
//     return c * (vec2(1.0) + (contrast>0.0 ? vec2(contrast*2.0, contrast*.33) : vec2(contrast*.5, contrast*.5)));
// }
// //soft brightness
// float brightnessHSL(float c, float bright) {
//     return bright>0.0 ? c * (1.0 + bright*1.5) + bright*.02 : c * (1.0 + bright*.95);
// }
// vec3 contrastRGB(vec3 c, float contr) {
//     vec3 dC = c - vec3(0.5);
//     return vec3(0.5) + sign(dC)*pow(abs(dC), vec3(1.0/contr));
// }
// vec3 contrast2(vec3 c, float contr) {
//     float f = 1.01*(contr + 1.0) / (1.01-contr);
//     vec3 cHalf = vec3(.5);
//     return f * (c - cHalf) + cHalf;
// }
// /////////////////////////////////////////////////
// vec3 gammaCorrection(vec3 c, float gamma) {
//     return saturate(vec3(  c.r < 0.0031308f ? 12.92f*c.r : 1.055f * pow(c.r, gamma) - .055f, c.g < 0.0031308f ? 12.92f*c.g : 1.055f * pow(c.g, gamma) - .055f, c.b < 0.0031308f ? 12.92f*c.b : 1.055f * pow(c.b, gamma) - .055f  ));
// }
// /////////////////////////////////////////////////
// vec3 rgb2yuv(vec3 c) {
//     // alias... YCrCb
//     float y = luminance(c);
//     float u = (c.b - y) * 0.564f; //= -0.169R - 0.331G + 0.500B
    
//     float v = (c.r - y) * 0.713f; //= 0.500R - 0.419G - 0.081B
    
    
//     return vec3(y, u, v);
// }
// /////////////////////////////////////////////////
// vec3 yuv2rgb(vec3 c) {
//     float R = c.x + c.z * 1.402f;
//     float G = c.x - c.y * 0.344f - c.z * 0.714;
//     float B = c.x + c.y * 1.772f;
//     return vec3(R, G, B);
// }
// /////////////////////////////////////////////////
// vec3 rgb2hcv(vec3 rgb) {
//     vec4 P = (rgb.g < rgb.b) ? vec4(rgb.bg, -1.0, 2.0/3.0) : vec4(rgb.gb, 0.0, -1.0/3.0);
//     vec4 Q = (rgb.r < P.x)   ? vec4(P.xyw, rgb.r)          : vec4(rgb.r, P.yzx);
//     float C = Q.x - min(Q.w, Q.y);
//     float H = abs((Q.w - Q.y) / (6.0 * C + epsilon) + Q.z);
//     return vec3(H, C, Q.x);
// }
// /////////////////////////////////////////////////
// vec3 hue2rgb(float hue) {
//     float H = fract(hue);
//     return saturate(vec3(      abs(H * 6.0 - 3.0) - 1.0, 2.0 - abs(H * 6.0 - 2.0), 2.0 - abs(H * 6.0 - 4.0) 
//     ));
// }
// /////////////////////////////////////////////////
// vec3 hsv2rgb(vec3 hsv) {
//     vec3 rgb = hue2rgb(hsv.x);
//     return ((rgb - 1.0) * hsv.y + 1.0) * hsv.z;
// }
// /////////////////////////////////////////////////
// vec3 hsl2rgb(vec3 hsl) {
//     vec3 rgb = hue2rgb(hsl.x);
//     float C = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
//     return (rgb - 0.5) * C + hsl.z;
// }
// /////////////////////////////////////////////////
// vec3 hcy2rgb(vec3 hcy) {
//     vec3 RGB = hue2rgb(hcy.x);
//     float Z = luminance(RGB);
//     return (RGB - Z) * ((hcy.z < Z) ? hcy.y * hcy.z / Z : ((Z < 1.0) ? hcy.y * (1.0 - hcy.z) / (1.0 - Z) : hcy.y)) + hcy.z;
// }
// /////////////////////////////////////////////////
// vec3 rgb2hsv(vec3 rgb) {
//     vec3 HCV = rgb2hcv(rgb);
//     float S = HCV.y / (HCV.z + epsilon);
//     return vec3(HCV.x, S, HCV.z);
// }
// /////////////////////////////////////////////////
// vec3 rgb2hsl(vec3 rgb) {
//     vec3 HCV = rgb2hcv(rgb);
//     float L = HCV.z - HCV.y * 0.5;
//     float S = HCV.y / (1.0 - abs(L * 2.0 - 1.0) + epsilon);
//     return vec3(HCV.x, S, L);
// }
// /////////////////////////////////////////////////
// vec3 rgb2hcy(vec3 rgb) {
//     vec3 HCV = rgb2hcv(rgb);
//     float Y = luminance(rgb);
//     float Z = luminance(hue2rgb(HCV.x));
//     HCV.y *= (Y < Z) ? Z / (epsilon + Y) : (1.0 - Z) / (epsilon + 1.0 - Y);
//     return vec3(HCV.x, HCV.y, Y);
// }
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Copyright (c) 2018-2019 Michele Morrone
//  All rights reserved.
//
//  https://michelemorrone.eu - https://BrutPitt.com
//
//  me@michelemorrone.eu - brutpitt@gmail.com
//  twitter: @BrutPitt - github: BrutPitt
//  
//  https://github.com/BrutPitt/glslSmartDeNoise/
//
//  This software is distributed under the terms of the BSD 2-Clause license
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#line 13    //#version dynamically inserted 

out vec4 color;
// #ifdef GL_ES
//     uniform sampler2D imageData;
// #else
//     #if (__VERSION__ >= 450)
//         layout (binding = 1) uniform sampler2D imageData;
//     #else 
//         uniform sampler2D imageData;
//     #endif
// #endif


uniform sampler2D imageData;
uniform float uSigma;
uniform float uThreshold;
// uniform float uSlider;
uniform float uKSigma;
uniform vec2 wSize;
// uniform float invGamma;
// uniform bool useTest;
uniform int whichTest;

// uniform sampler2D tDiffuse;

#ifdef GL_ES
    #define saturate(v) clamp(v, vec3(0.0), vec3(1.0))
#else
    #ifndef saturate
        #define saturate(v) clamp(v, 0.0, 1.0)
    #endif
#endif

#define INV_SQRT_OF_2PI 0.39894228040143267793994605993439  // 1.0/SQRT_OF_2PI
#define INV_PI 0.31830988618379067153776752674503

//  smartDeNoise - parameters
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//  sampler2D tex     - sampler image / texture
//  vec2 uv           - actual fragment coord
//  float sigma  >  0 - sigma Standard Deviation
//  float kSigma >= 0 - sigma coefficient 
//      kSigma * sigma  -->  radius of the circular kernel
//  float threshold   - edge sharpening threshold 

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
//  About Standard Deviations (watch Gauss curve)
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//  kSigma = 1*sigma cover 68% of data
//  kSigma = 2*sigma cover 95% of data - but there are over 3 times 
//                   more points to compute
//  kSigma = 3*sigma cover 99.7% of data - but needs more than double 
//                   the calculations of 2*sigma


//  Optimizations (description)
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//  fX = exp( -(x*x) * invSigmaSqx2 ) * invSigmaxSqrt2PI; 
//  fY = exp( -(y*y) * invSigmaSqx2 ) * invSigmaxSqrt2PI; 
//  where...
//      invSigmaSqx2 = 1.0 / (sigma^2 * 2.0)
//      invSigmaxSqrt2PI = 1.0 / (sqrt(2 * PI) * sigma)
//
//  now, fX*fY can be written in unique expression...
//
//      e^(a*X) * e^(a*Y) * c*c
//
//      where:
//        a = invSigmaSqx2, X = (x*x), Y = (y*y), c = invSigmaxSqrt2PI
//
//           -[(x*x) * 1/(2 * sigma^2)]             -[(y*y) * 1/(2 * sigma^2)] 
//          e                                      e
//  fX = -------------------------------    fY = -------------------------------
//                ________                               ________
//              \/ 2 * PI  * sigma                     \/ 2 * PI  * sigma
//
//      now with... 
//        a = 1/(2 * sigma^2), //        X = (x*x) 
//        Y = (y*y) ________
//        c = 1 / \/ 2 * PI  * sigma
//
//      we have...
//              -[aX]              -[aY]
//        fX = e      * c;   fY = e      * c;
//
//      and...
//                 -[aX + aY]    [2]     -[a(X + Y)]    [2]
//        fX*fY = e           * c = e            * c   
//
//      well...
//
//                    -[(x*x + y*y) * 1/(2 * sigma^2)]
//                   e                                
//        fX*fY = --------------------------------------
//                                        [2]           
//                          2 * PI * sigma           
//      
//      now with assigned constants...
//
//          invSigmaQx2 = 1/(2 * sigma^2)
//          invSigmaQx2PI = 1/(2 * PI * sigma^2) = invSigmaQx2 * INV_PI 
//
//      and the kernel vector 
//
//          k = vec2(x, y)
//
//      we can write:
//
//          fXY = exp( -dot(k, k) * invSigmaQx2) * invSigmaQx2PI
//


// vec4 smartDeNoise_sRGB(sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold) {
//     float radius = round(kSigma*sigma);
//     float radQ = radius * radius;
//     float invSigmaQx2 = .5 / (sigma * sigma);      // 1.0 / (sigma^2 * 2.0)
    
//     float invSigmaQx2PI = INV_PI * invSigmaQx2;    // // 1/(2 * PI * sigma^2)
    
    
//     float invThresholdSqx2 = .5 / (threshold * threshold);     // 1.0 / (sigma^2 * 2.0)
    
//     float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;   // 1.0 / (sqrt(2*PI) * sigma)
    
    
//     vec3 centrPx = pow(texture(tex, uv).rgb, vec3(invGamma));
//     float zBuff = 0.0;
//     vec3 aBuff = vec3(0.0);
//     vec2 size = vec2(textureSize(tex, 0));
//     vec2 d;
//     for (d.x = -radius; d.x <= radius; d.x++) {
//         float pt = sqrt(radQ-d.x*d.x);       // pt = yRadius: have circular trend
        
//         for (d.y = -pt; d.y <= pt; d.y++) {
//             float blurFactor = exp( -dot(d, d) * invSigmaQx2 ) * invSigmaQx2PI;
//             vec3 walkPx = texture(tex, uv+d/size).rgb;
//             vec3 dC = pow(walkPx, vec3(invGamma))-centrPx;
//             float deltaFactor = exp( -dot(dC, dC) * invThresholdSqx2) * invThresholdSqrt2PI * blurFactor;
//             zBuff += deltaFactor;
//             aBuff += deltaFactor*walkPx;
//         }

//     }
//     return vec4(aBuff/zBuff, 1.0);
// }
// vec4 smartDeNoise_HSL(sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold) {
//     float radius = round(kSigma*sigma);
//     float radQ = radius * radius;
//     float invSigmaQx2 = .5 / (sigma * sigma);      // 1.0 / (sigma^2 * 2.0)
    
//     float invSigmaQx2PI = INV_PI * invSigmaQx2;    // // 1/(2 * PI * sigma^2)
    
    
//     float invThresholdSqx2 = .5 / (threshold * threshold);     // 1.0 / (sigma^2 * 2.0)
    
//     float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;   // 1.0 / (sqrt(2*PI) * sigma)
    
    
    
//     vec3 c = texture(tex, uv).rgb;
//     vec3 centrHSL = rgb2hsl(c);
//     float zBuff = 0.0;
//     vec4 aBuff = vec4(0.0);
//     vec2 size = vec2(textureSize(tex, 0));
//     vec2 d;
//     for (d.x = -radius; d.x <= radius; d.x++) {
//         float pt = sqrt(radQ-d.x*d.x);       // pt = yRadius: have circular trend
        
//         for (d.y = -pt; d.y <= pt; d.y++) {
//             float blurFactor = exp( -dot(d, d) * invSigmaQx2 ) * invSigmaQx2PI;
//             vec4 walkPx = texture(tex, uv+d/size);
//             vec3 walkPxHSL = rgb2hsl(walkPx.rgb);
//             vec3 dC = walkPxHSL - centrHSL;
//             float deltaFactor = exp( -dot(dC.xz, dC.xz) * invThresholdSqx2) * invThresholdSqrt2PI * blurFactor;
//             zBuff += deltaFactor;
//             aBuff += deltaFactor*walkPx;
//         }

//     }
//     return aBuff/zBuff;
// }
// vec4 smartDeNoise_lum(sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold) {
//     float radius = round(kSigma*sigma);
//     float radQ = radius * radius;
//     float invSigmaQx2 = .5 / (sigma * sigma);      // 1.0 / (sigma^2 * 2.0)
    
//     float invSigmaQx2PI = INV_PI * invSigmaQx2;    // // 1/(2 * PI * sigma^2)
    
    
//     float invThresholdSqx2 = .5 / (threshold * threshold);     // 1.0 / (sigma^2 * 2.0)
    
//     float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;   // 1.0 / (sqrt(2*PI) * sigma)
    
    
    
//     vec3 c = texture(tex, uv).rgb;
//     float centrLum = whichTest == 1 ? luminance(c) : linearLum(c);
//     float zBuff = 0.0;
//     vec4 aBuff = vec4(0.0);
//     vec2 size = vec2(textureSize(tex, 0));
//     vec2 d;
//     for (d.x = -radius; d.x <= radius; d.x++) {
//         float pt = sqrt(radQ-d.x*d.x);       // pt = yRadius: have circular trend
        
//         for (d.y = -pt; d.y <= pt; d.y++) {
//             float blurFactor = exp( -dot(d, d) * invSigmaQx2 ) * invSigmaQx2PI;
//             vec4 walkPx = texture(tex, uv+d/size);
//             float dC = (whichTest == 1 ? luminance(walkPx.rgb) : linearLum(walkPx.rgb)) - centrLum;
//             float deltaFactor = exp( -(dC * dC) * invThresholdSqx2) * invThresholdSqrt2PI * blurFactor;
//             zBuff += deltaFactor;
//             aBuff += deltaFactor*walkPx;
//         }

//     }
//     return aBuff/zBuff;
// }
// vec4 smartDeNoise_test(sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold) {
//     switch(whichTest) {
//         case 0: //sRGB
//         return smartDeNoise_sRGB(imageData, uv, uSigma, uKSigma, uThreshold);
//         case 1: //luminance
//         case 2: //linear Luminance
//         return smartDeNoise_lum(imageData, uv, uSigma, uKSigma, uThreshold);
//         default:
//         case 3:
//         return smartDeNoise_HSL(imageData, uv, uSigma, uKSigma, uThreshold);
//     }

// }
void main(void) {
    // float slide = uSlider *.5 + .5;
    // float szSlide = .001;
    vec2 uv = vec2(gl_FragCoord.xy / wSize);

    // vec4 c = useTest ?  smartDeNoise_test(imageData, vec2(uv.x, 1.0-uv.y), uSigma, uKSigma, uThreshold) :
    // smartDeNoise     (imageData, vec2(uv.x, 1.0-uv.y), uSigma, uKSigma, uThreshold);
    // color = uv.x<slide-szSlide  ? texture(imageData, vec2(uv.x, 1.0-uv.y)) :
    // (uv.x>slide+szSlide ? c : vec4(1.0));

    color = smartDeNoise(imageData, vec2(uv.x, 1.0-uv.y), uSigma, uKSigma, uThreshold) * 2.0 + 0.15;
    // color = texture(imageData, vec2(uv.x, 1.0-uv.y)) * 2.0 +0.15;
}


`
