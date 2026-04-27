import { PerspectiveCamera, Vector3 } from 'three';

import { INITIAL_CAMERA_POSITION } from '../../../constants/three.js';

/**
 * Camera rig that centralizes camera state and camera animation lifecycle.
 */
export class CameraRig {
  _camera = null;
  _basePosition = null;
  _target = null;
  _animationState = { isAnimating: false, activeAnimationId: 0 };

  /**
   * @param {{ canvas: HTMLCanvasElement }} options
   */
  constructor({ canvas }) {
    this._camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 10);

    this._camera.position.set(
      INITIAL_CAMERA_POSITION.x,
      INITIAL_CAMERA_POSITION.y,
      INITIAL_CAMERA_POSITION.z,
    );

    this._basePosition = new Vector3(
      INITIAL_CAMERA_POSITION.x,
      INITIAL_CAMERA_POSITION.y,
      INITIAL_CAMERA_POSITION.z,
    );
    this._target = new Vector3(0, 0, 0);
  }

  get camera() {
    return this._camera;
  }

  get basePosition() {
    return this._basePosition;
  }

  get target() {
    return this._target;
  }

  /**
   * Get mutable animation state for camera transitions.
   * @returns {{ isAnimating: boolean, activeAnimationId: number }}
   */
  getAnimationState() {
    return this._animationState;
  }

  /**
   * Mark a new camera animation as active.
   * @returns {number}
   */
  beginAnimation() {
    this._animationState.activeAnimationId += 1;
    this._animationState.isAnimating = true;
    return this._animationState.activeAnimationId;
  }

  /**
   * Complete a camera animation if the ID still matches the active animation.
   * @param {number} animationId
   * @returns {void}
   */
  finishAnimation(animationId) {
    if (this._animationState.activeAnimationId === animationId) {
      this._animationState.isAnimating = false;
    }
  }
}

/**
 * Shared camera rig singleton.
 */
export const cameraRig = new CameraRig({ canvas: renderCanvas });
/**
 * Active PerspectiveCamera instance.
 */
export const camera = cameraRig.camera;
/**
 * Base camera position used by parallax and animations.
 */
export const cameraBasePosition = cameraRig.basePosition;
/**
 * Camera look-at target vector.
 */
export const cameraTarget = cameraRig.target;

/**
 * Access camera animation state.
 * @returns {{ isAnimating: boolean, activeAnimationId: number }}
 */
export const getCameraAnimationState = () => cameraRig.getAnimationState();
/**
 * Begin a camera animation and return its ID.
 * @returns {number}
 */
export const beginCameraAnimation = () => cameraRig.beginAnimation();
/**
 * Finish a camera animation by ID.
 * @param {number} animationId
 * @returns {void}
 */
export const finishCameraAnimation = (animationId) => cameraRig.finishAnimation(animationId);
