import { CubeTexture } from 'three';

const cubeFaceMapping = [0,1,2,3,4,5]

export function unpackCubemaps(
  image: HTMLImageElement,
  cubemapsCoords: number[][][],
  canvas = document.createElement('canvas')
): CubeTexture[] {
  const [left, right, top, bottom] = cubemapsCoords[0][0];
  const width = right - left;
  const height = bottom - top;

  canvas.width = width;
  canvas.height = height;

  const cubemaps: CubeTexture[] = [];
  

  

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  for (let cubeInd = 0; cubeInd < cubemapsCoords.length; cubeInd++) {
    const cubemapData = [];
    const coords = cubemapsCoords[cubeInd];
    for (let g = 0; g < 6; g++) {
      const i = cubeFaceMapping[g];
      const [left, right, top, bottom] = coords[i];
      const width = right - left;
      const height = bottom - top;

      ctx.drawImage(image as any, left, top, width, height, 0, 0, width, height);

      cubemapData.push(ctx.getImageData(0, 0, width, height));

      
    }
    const t = new CubeTexture(cubemapData);
    t.needsUpdate = true; 
    cubemaps.push(t);


  }


  return cubemaps;
}
