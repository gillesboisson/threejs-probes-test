



export function getCubemapPackLayout(
  cubemapSize: number,
  nbCubemap = 1,
  maxTextureSize = 1024,
  nbFaceX = 4,
  nbFaceY = 2
) {
  const cluster_width = cubemapSize * nbFaceX;
  const cluster_height = cubemapSize * nbFaceY;

  const nb_cluster_x = Math.min(
    Math.floor(maxTextureSize / cluster_width),
    nbCubemap
  );
  const nb_cluster_y = Math.ceil(nbCubemap / nb_cluster_x);

  const texture_width = nb_cluster_x * cluster_width;
  const texture_height = nb_cluster_y * cluster_height;

  return [
    texture_width,
    texture_height,
    nb_cluster_x,
    nb_cluster_y,
    cluster_width,
    cluster_height,
  ];
}
