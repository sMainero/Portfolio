import { camera, cameraTarget } from '../camera/camera.js';
import { renderer } from '../renderer/renderer.js';
import { createOrbitControls } from './orbitControls.js';

export const controls = createOrbitControls({
  camera,
  domElement: renderer.domElement,
  target: cameraTarget,
});
