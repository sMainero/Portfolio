import { WebGLRenderer } from 'three';

// 🖥️ Renderer
export const renderer = new WebGLRenderer({
  canvas: renderCanvas,
  antialias: true,
});
// false = don't override the CSS size set by the layout
renderer.setSize(renderCanvas.clientWidth, renderCanvas.clientHeight, false);
