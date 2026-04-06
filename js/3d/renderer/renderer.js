import { WebGLRenderer } from 'three';

export class RendererContext {
  _renderer = null;

  constructor({ canvas }) {
    this._renderer = new WebGLRenderer({
      canvas,
      antialias: true,
    });

    // false = don't override the CSS size set by the layout
    this._renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }

  get renderer() {
    return this._renderer;
  }
}

export const rendererContext = new RendererContext({ canvas: renderCanvas });
export const renderer = rendererContext.renderer;
