import { getCubemapPackLayout } from './getCubemapPackLayout';





export function getCubemapPackCoords(
  cubemap_size: number,
  subLevel = 0,
  nbCubemap = 1,
  maxTextureSize = 1024,
  nbFaceX = 4,
  nbFaceY = 2
) {
  const coords = [];

  const [
    textureWidth, textureHeight, nbClusterX, nbClusterY, clusterWidth, clusterHeight,
  ] = getCubemapPackLayout(
    cubemap_size,
    nbCubemap,
    maxTextureSize,
    nbFaceX,
    nbFaceY
  );

  cubemap_size /= Math.pow(2, subLevel);

  // const data = new Float32Array(nbCubemap * 6 * 4 * 2)
  // let dataInd = 0
  for (let i = 0; i < nbCubemap; i++) {
    const clusterX = i % nbClusterX;
    const clusterY = Math.floor(i / nbClusterX);

    let left = clusterX * clusterWidth;
    let top = clusterY * clusterHeight;

    for (let f = 0; f < subLevel; f++) {
      left += clusterWidth / (2 * (f + 1));
      top += clusterHeight / (2 * (f + 1));
    }

    const mapCoords = [];

    for (let faceInd = 0; faceInd < 6; faceInd++) {
      const faceX = faceInd % nbFaceX;
      const faceY = Math.floor(faceInd / nbFaceX);

      const faceLeft = left + faceX * cubemap_size;
      const faceTop = top + faceY * cubemap_size;

      mapCoords.push([
        faceLeft,
        faceLeft + cubemap_size,
        faceTop,
        faceTop + cubemap_size,
      ]);

      // dataInd += 8
    }

    coords.push(mapCoords);
  }

  return coords;
}
