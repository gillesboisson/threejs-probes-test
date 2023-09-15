import {
  Texture, Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three';
import { MPPostProcess } from './PostProcess';



export class PostProcessMultiPass {
  protected renderTargets: WebGLRenderTarget[];
  constructor(
    readonly renderer: WebGLRenderer,
    readonly size = renderer.getSize(new Vector2()),
    renderTarget = new WebGLRenderTarget(size.x, size.y)
  ) {
    this.renderTargets = [
      renderTarget,
      renderTarget.clone(),
    ];
  }

  render(nbPass: number, postProcess: MPPostProcess, destRenderTarget: WebGLRenderTarget | null) {
    let textureSource: Texture;
    let renderTargetDest: WebGLRenderTarget;
    const material = postProcess.getMaterial();
    const sourceMap = material.diffuseMap;
    const scene = postProcess.scene;
    const camera = postProcess.camera;
    this.renderer.autoClear = false;
    for (let i = 0; i < nbPass; i++) {

      renderTargetDest = i === nbPass - 1 ?
        destRenderTarget : // take dest render on last pass
        this.renderTargets[(i + 1) % 2]; // swap render target (pass index is even ? 0 : 1) otherwise

      textureSource = i === 0 ?
        sourceMap : // take source map as
        this.renderTargets[(i) % 2].texture; // swap render target (pass index is even ? 0 : 1) otherwise
      material.diffuseMap = textureSource;

      this.renderer.setRenderTarget(renderTargetDest);
      this.renderer.clear();
      this.renderer.render(scene, camera);

    }
    this.renderer.autoClear = true;

    material.diffuseMap = sourceMap;
  }
}
