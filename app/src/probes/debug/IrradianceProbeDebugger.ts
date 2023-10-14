import { ShaderMaterial } from 'three'
import { ProbeRatio } from '../type'

export class IrradianceProbeDebugMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        map0: { value: null },
        map1: { value: null },
        map2: { value: null },
        map3: { value: null },
        map4: { value: null },
        map5: { value: null },
        map6: { value: null },
        map7: { value: null },
        map8: { value: null },
        map9: { value: null },
        map10: { value: null },
        map11: { value: null },
        map12: { value: null },
        map13: { value: null },
        map14: { value: null },
        map15: { value: null },

        mapRatio: { value: new Float32Array(16) },
      },

      vertexShader: `
    
        uniform float mapRatio[16];
        uniform samplerCube map0;
        uniform samplerCube map1;
        uniform samplerCube map2;
        uniform samplerCube map3;
        uniform samplerCube map4;
        uniform samplerCube map5;
        uniform samplerCube map6;
        uniform samplerCube map7;
        uniform samplerCube map8;
        uniform samplerCube map9;
        uniform samplerCube map10;
        uniform samplerCube map11;
        uniform samplerCube map12;
        uniform samplerCube map13;
        uniform samplerCube map14;
        uniform samplerCube map15;
    
        // varying vec3 vNormal;
        varying vec3 vProbedColor;
    
        void main() {
          // vNormal = (normal).xyz;
          vProbedColor = 
            (texture(map0, normal) * mapRatio[0] +
            texture(map1, normal) * mapRatio[1] +
            texture(map2, normal) * mapRatio[2] +
            texture(map3, normal) * mapRatio[3] +
            texture(map4, normal) * mapRatio[4] +
            texture(map5, normal) * mapRatio[5] +
            texture(map6, normal) * mapRatio[6] +
            texture(map7, normal) * mapRatio[7] +
            texture(map8, normal) * mapRatio[8] +
            texture(map9, normal) * mapRatio[9] +
            texture(map10, normal) * mapRatio[10] +
            texture(map11, normal) * mapRatio[11] +
            texture(map12, normal) * mapRatio[12] +
            texture(map13, normal) * mapRatio[13] +
            texture(map14, normal) * mapRatio[14] +
            texture(map15, normal) * mapRatio[15]).rgb;
    
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
          
        }
      `,
      fragmentShader: `
        
    
      
    
        // varying vec3 vNormal;
        varying vec3 vProbedColor;
    
    
        void main() {
    
          // gl_FragColor = vec4(mapRatio[0], mapRatio[0], mapRatio[0], 1.0);
    
          gl_FragColor = vec4(vProbedColor,1.0);
            
          
        }
      `,
    })
  }

  updateProbeRatio(probeRatio: ProbeRatio[]) {
    for (let i = 0; i < 16; i++) {
      this.uniforms.mapRatio.value[i] =
        probeRatio[i] !== undefined ? probeRatio[i][1] : 0
      this.uniforms[`map${i}`].value =
        probeRatio[i] !== undefined ? probeRatio[i][0].texture : null
    }

    this.needsUpdate = true;
  }
}