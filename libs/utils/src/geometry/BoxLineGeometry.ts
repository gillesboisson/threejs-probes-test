import { BoxGeometry, BufferGeometry, Uint16BufferAttribute } from 'three'

export class BoxLineGeometry extends BufferGeometry {
  constructor(width?: number, height?: number, depth?: number) {
    super()

    const boxGeom = new BoxGeometry(width, height, depth)

    this.setAttribute('position', boxGeom.getAttribute('position'))
    this.setIndex(
      new Uint16BufferAttribute(
        new Uint16Array([0, 1, 3, 2, 0, 5, 4, 1, 4, 6, 3, 6, 7, 2, 7, 5]),
        1
      )
    )
  }
}
