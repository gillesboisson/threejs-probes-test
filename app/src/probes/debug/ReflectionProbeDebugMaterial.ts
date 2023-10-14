import { ShaderMaterial } from 'three';
import { ProbeRatio } from '../type';




export class ReflectionProbeDebugMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        map0: { value: null },
        map1: { value: null },
        map2: { value: null },
        map3: { value: null },

        mapRatio: { value: new Float32Array(4) },
      },

      vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
  
      void main() {
        vNormal = ( normal).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        vPosition = position;
      }`,
      fragmentShader: `
        
      
      uniform float mapRatio[4];
      uniform samplerCube map0;
      uniform samplerCube map1;
      uniform samplerCube map2;
      uniform samplerCube map3;
    
      varying vec3 vPosition;
      varying vec3 vNormal;
      
    
      void main() {
  
        vec3 viewDir = normalize(vPosition - cameraPosition);
        vec3 normal = normalize(vNormal);
        vec3 reflexion = reflect(viewDir, normal);


        vec3 probcolor = 
          (texture(map0, reflexion) * mapRatio[0] +
          texture(map1, reflexion) * mapRatio[1] +
          texture(map2, reflexion) * mapRatio[2] +
          texture(map3, reflexion) * mapRatio[3]).rgb;
  

        gl_FragColor = vec4(probcolor,1.0);
          

        
      }
      `,
    });
  }

  updateProbeRatio(probeRatio: ProbeRatio[]) {
    for (let i = 0; i < 4; i++) {
      this.uniforms.mapRatio.value[i] =
        probeRatio[i] !== undefined ? probeRatio[i][1] : 0;
      this.uniforms[`map${i}`].value =
        probeRatio[i] !== undefined ? probeRatio[i][0].texture : null;
    }

    this.needsUpdate = true;
  }
}
