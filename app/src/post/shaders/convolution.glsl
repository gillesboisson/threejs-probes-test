#ifndef MAX_LENGTH
#define MAX_LENGTH 64
#endif

struct Kernel
{
  float data[MAX_LENGTH];
  float radius;
  int width;
  int height;
  int minX;
  int minY;
  int maxX;
  int maxY;
};

// uniform float convolutionkernel[MAX_LENGTH];
// uniform float convolutionRadius;

vec3 convolutionVec3(
  sampler2D map,    // source texture
  vec2 textureSize,     // source texture size
  vec2 uv,              // targeted texture position
  in Kernel kernel      // kernels
){
  int vX;
  int vY;

  float stepX = kernel.radius / textureSize.x;
  float stepY = kernel.radius / textureSize.y;
  int maxLength = kernel.width * kernel.height;

  vec3 res = vec3(0.0);
  
  for(vX = kernel.minX; vX <= kernel.maxX ; vX++ ){
    int vXMaxX = vX + kernel.maxX;
    float stepVX= float (vX) * stepX;
    for(vY = kernel.minY; vY <= kernel.maxY ; vY++ ){
      int ind = kernel.width * (vY + kernel.maxY) + vXMaxX;
      if(ind < 0 || ind > maxLength) continue;
      if(kernel.data[ind] != 0.0){
        res += texture2D(map, uv + vec2(stepVX, float(vY) * stepY)).rgb * kernel.data[ind];
      }
    }
  }

  return res;
}

vec4 convolutionVec4(
  sampler2D map,    // source texture
  vec2 textureSize,     // source texture size
  vec2 uv,              // targeted texture position
  in Kernel kernel      // kernels
){
  int vX;
  int vY;

  float stepX = kernel.radius / textureSize.x;
  float stepY = kernel.radius / textureSize.y;
  int maxLength = kernel.width * kernel.height;

  vec4 res = vec4(0.0);
  
  for(vX = kernel.minX; vX <= kernel.maxX ; vX++ ){
    int vXMaxX = vX + kernel.maxX;
    float stepVX= float (vX) * stepX;
    for(vY = kernel.minY; vY <= kernel.maxY ; vY++ ){
      int ind = kernel.width * (vY + kernel.maxY) + vXMaxX;
      if(ind < 0 || ind > maxLength) continue;
      if(kernel.data[ind] != 0.0){
        res += texture2D(map, uv + vec2(stepVX, float(vY) * stepY)) * kernel.data[ind];
      }
    }
  }

  return res;
}


float convolutionFloat(
  sampler2D map,    // source texture
  vec2 textureSize,     // source texture size
  int vecIndex,
  vec2 uv,              // targeted texture position
  in Kernel kernel      // kernels
){
  int vX;
  int vY;

  float stepX = kernel.radius / textureSize.x;
  float stepY = kernel.radius / textureSize.y;
  int maxLength = kernel.width * kernel.height;

  float res = 0.0;
  
  for(vX = kernel.minX; vX <= kernel.maxX ; vX++ ){
    int vXMaxX = vX + kernel.maxX;
    float stepVX= float (vX) * stepX;
    for(vY = kernel.minY; vY <= kernel.maxY ; vY++ ){
      int ind = kernel.width * (vY + kernel.maxY) + vXMaxX;
      if(ind < 0 || ind > maxLength) continue;
      if(kernel.data[ind] != 0.0){
        res += texture2D(map, uv + vec2(stepVX, float(vY) * stepY))[vecIndex] * kernel.data[ind];
      }
    }
  }

  return res;
}