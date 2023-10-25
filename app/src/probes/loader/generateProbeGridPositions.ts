import { Vector3 } from 'three'

export function generateProbeGridPositions(
  resolution: Vector3,
): Vector3[] {
  // const [resolutionX, resolutionZ, resolutionY] = data.data.resolution
  // const [scaleX, scaleZ, scaleY] = data.scale.map((s) => s * 2)
  // // const [positionX, positionY, positionZ] = data.position

  const resolutionX = resolution.x
  const resolutionY = resolution.y
  const resolutionZ = resolution.z

  const stepX = 2 / resolutionX
  const stepY = 2 / resolutionY
  const stepZ = 2 / resolutionZ

  const x0 = -1 + stepX / 2
  const y0 = -1 + stepY / 2
  const z0 = -1 + stepZ / 2

  const positions = new Array(resolutionX * resolutionY * resolutionZ)
  let index = 0

  for (let iX = 0; iX < resolutionX; iX++) {
    const x = x0 + iX * stepX

    for (let iY = 0; iY < resolutionY; iY++) {
      const y = y0 + iY * stepY

      for (let iZ = 0; iZ < resolutionZ; iZ++) {
        const z = z0 + iZ * stepZ
        
        positions[index] = new Vector3(x, y, z)
        index++
      }
    }
  }

  return positions
}
