import { camera, cameraTarget } from '../camera/camera.js';
import { renderer } from '../renderer/renderer.js';
import { createOrbitControls } from './orbitControls.js';

/**
 * Wrapper around orbit controls used by the 3D world.
 */
export class ControlsContext {
  /** @type {import('three/examples/jsm/controls/OrbitControls.js').OrbitControls | null} */
  _controls = null;

  /**
   * @param {{
   *   cameraRef: import('three').PerspectiveCamera,
   *   domElement: HTMLElement,
   *   target: import('three').Vector3
   * }} options
   */
  constructor({ cameraRef, domElement, target }) {
    this._controls = createOrbitControls({
      camera: cameraRef,
      domElement,
      target,
    });
  }

  /**
   * @returns {import('three/examples/jsm/controls/OrbitControls.js').OrbitControls | null}
   */
  get controls() {
    return this._controls;
  }
}

/**
 * Shared controls context singleton.
 */
export const controlsContext = new ControlsContext({
  cameraRef: camera,
  domElement: renderer.domElement,
  target: cameraTarget,
});

/**
 * Shared orbit controls instance.
 */
export const controls = controlsContext.controls;
