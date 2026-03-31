import { WebGLRenderer } from 'three';

// 🖥️ Renderer
export const renderer = new WebGLRenderer({
  canvas: secondaryCanvas,
  antialias: true,
});
// false = don't override the CSS size set by the layout
renderer.setSize(
  secondaryCanvas.clientWidth,
  secondaryCanvas.clientHeight,
  false,
);
