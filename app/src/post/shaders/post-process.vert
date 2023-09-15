#version 300 es
precision highp float;
precision highp int;

// Common fast post process vertex shader 

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main(void) {
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    gl_Position = vec4(position,1.0);
    vUv = uv;
}