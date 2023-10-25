import { getCubemapPackLayout } from './getCubemapPackLayout';





export function getCubemapPackCoords(
  cubemapSize: number,
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
    cubemapSize,
    nbCubemap,
    maxTextureSize,
    nbFaceX,
    nbFaceY
  );

  cubemapSize /= Math.pow(2, subLevel);
  const subLevelPow2 = Math.pow(2, subLevel)


  for (let i = 0; i < nbCubemap; i++) {
    const clusterX = i % nbClusterX;
    const clusterY = Math.floor(i / nbClusterX);

    let left = clusterX * clusterWidth;
    let top = clusterY * clusterHeight;

    left += clusterWidth - clusterWidth / subLevelPow2
    top += clusterHeight - clusterHeight / subLevelPow2


    const mapCoords = [];

    for (let faceInd = 0; faceInd < 6; faceInd++) {
      const faceX = faceInd % nbFaceX;
      const faceY = Math.floor(faceInd / nbFaceX);

      const faceLeft = left + faceX * cubemapSize;
      const faceTop = top + faceY * cubemapSize;

      mapCoords.push([
        faceLeft,
        faceLeft + cubemapSize,
        faceTop,
        faceTop + cubemapSize,
      ]);

      // dataInd += 8
    }

    coords.push(mapCoords);
  }

  return coords;
}
