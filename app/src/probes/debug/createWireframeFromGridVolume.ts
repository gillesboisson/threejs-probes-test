// export function createWireframeFromGridVolume(, color = 0xffffff) {
//     const wireframe = new WireframeGeometry(volume);
//     const material = new LineBasicMaterial({
//         color,
//         transparent: true,
//         opacity: 0.5,
//     });
//     const mesh = new LineSegments(wireframe, material);
//     mesh.renderOrder = 1;
//     mesh.onBeforeRender = (renderer) => {
//         renderer.clearDepth();
//     };
//     return mesh;
// }