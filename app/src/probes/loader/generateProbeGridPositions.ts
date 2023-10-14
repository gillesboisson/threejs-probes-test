import { Vector3 } from 'three'

export function generateProbeGridPositions(
  resolution: Vector3,
  scale: Vector3
): Vector3[] {
  // const [resolutionX, resolutionZ, resolutionY] = data.data.resolution
  // const [scaleX, scaleZ, scaleY] = data.scale.map((s) => s * 2)
  // // const [positionX, positionY, positionZ] = data.position

  const resolutionX = resolution.x
  const resolutionY = resolution.y
  const resolutionZ = resolution.z
  const scaleX = scale.x * 2
  const scaleY = scale.y * 2
  const scaleZ = scale.z * 2

  const positions = new Array(resolutionX * resolutionY * resolutionZ)
  let index = 0

  for (let x = 0; x < resolutionX; x++) {
    const stepX = ((x + 0.5) / resolutionX - 0.5) * scaleX

    for (let y = 0; y < resolutionY; y++) {
      const stepY = ((y + 0.5) / resolutionY - 0.5) * scaleY

      for (let z = 0; z < resolutionZ; z++) {
        const stepZ = ((z + 0.5) / resolutionZ - 0.5) * scaleZ

        positions[index] = new Vector3(stepX, stepY, stepZ)
        index++
      }
    }
  }

  return positions
}
