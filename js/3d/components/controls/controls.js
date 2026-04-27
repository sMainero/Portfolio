import { camera, cameraTarget } from '../camera/camera.js';
import { renderer } from '../renderer/renderer.js';
import { createOrbitControls } from './orbitControls.js';

/** @typedef {ReturnType<typeof createOrbitControls>} OrbitControlsInstance */

/**
 * Wrapper around orbit controls used by the 3D world.
 */
export class ControlsContext {
  /** @type {OrbitControlsInstance | null} */
  _controls = null;

  /**
   * @param {{
   *   cameraRef: typeof camera,
   *   domElement: typeof renderer.domElement,
   *   target: typeof cameraTarget
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
   * @returns {OrbitControlsInstance}
   */
  get controls() {
    if (!this._controls) throw new Error('Controls are not initialized');
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
