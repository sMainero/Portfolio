import { camera, cameraTarget } from '../camera/camera.js';
import { renderer } from '../renderer/renderer.js';
import { createOrbitControls } from './orbitControls.js';

export class ControlsContext {
  _controls = null;

  constructor({ cameraRef, domElement, target }) {
    this._controls = createOrbitControls({
      camera: cameraRef,
      domElement,
      target,
    });
  }

  get controls() {
    return this._controls;
  }
}

export const controlsContext = new ControlsContext({
  cameraRef: camera,
  domElement: renderer.domElement,
  target: cameraTarget,
});

export const controls = controlsContext.controls;
