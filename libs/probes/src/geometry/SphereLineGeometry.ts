import { BufferAttribute, BufferGeometry } from "three";

export class SphereLineGeometry extends BufferGeometry {

  constructor(radius: number = 1, nbArcSegments: number = 25){
    super();

    // make sure nbArcSegments is a multiple of 4 in order to vertices to be aligned on the 4 axes
    const quatArcNbSegments = Math.round(nbArcSegments / 4);
    nbArcSegments = quatArcNbSegments * 4;


    const vertices = [];
    const indices = [];
    let indexOffset = 0;
    // z axis
    for(let i=0; i < nbArcSegments; i++){
      const angle = Math.PI * 2 * i / nbArcSegments;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      vertices.push(x, y, 0);
      indices.push(i);
    }
    
    indexOffset+= nbArcSegments;
    indices.push(indexOffset);

    // y axis
    for(let i=0; i < nbArcSegments; i++){
      const angle = Math.PI * 2 * i / nbArcSegments;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      vertices.push(x, 0, z);
      indices.push(indexOffset + i);
    }

    // as three.js line geom is a continuous line, we need to go back 45° on axis to start the next arc
    
    indices.push(indexOffset);                    // complete the last arc

    for(let i=0; i < quatArcNbSegments + 1; i++){
      indices.push(i);
    }

    indexOffset += nbArcSegments
    // indexOffset += quatArcNbSegments + 1;

    // x axis
    for(let i=0; i < nbArcSegments; i++){
      const angle = Math.PI * 2 * i / nbArcSegments;
      const y = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      vertices.push(0, y, z);
      indices.push(indexOffset + i);
    }

    indices.push(indexOffset);                    // complete the last arc


    this.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    this.setIndex(indices);

  }

}