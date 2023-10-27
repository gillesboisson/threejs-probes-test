import { ProbeMeshMaterial } from './ProbeMeshMaterial';


export class IrradianceProbeMeshMaterial extends ProbeMeshMaterial {
  constructor() {
    super({
      uniforms: {
        envMap: { value: null },
      },

      vertexShader: `
        varying vec3 vNormal;
    
        void main() {
          vNormal = ( normal).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform samplerCube envMap;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
    
        void main() {
          // gl_FragColor = vec4(vNormal / 2.0 + 0.5, 1.0);
          // gl_FragColor = vec4(1.0,0.0,0.0,1.0);
          gl_FragColor = textureCube(envMap, vNormal);
          #include <tonemapping_fragment>
	        #include <colorspace_fragment>
        }
      `,
    });
  }
}
