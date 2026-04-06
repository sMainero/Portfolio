import { PerspectiveCamera, Vector3 } from 'three';

import { INITIAL_CAMERA_POSITION } from '../../constants/three.js';

export class CameraRig {
  _camera = null;
  _basePosition = null;
  _target = null;
  _animationState = { isAnimating: false, activeAnimationId: 0 };

  constructor({ canvas }) {
    this._camera = new PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      10,
    );

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

  getAnimationState() {
    return this._animationState;
  }

  beginAnimation() {
    this._animationState.activeAnimationId += 1;
    this._animationState.isAnimating = true;
    return this._animationState.activeAnimationId;
  }

  finishAnimation(animationId) {
    if (this._animationState.activeAnimationId === animationId) {
      this._animationState.isAnimating = false;
    }
  }
}

export const cameraRig = new CameraRig({ canvas: renderCanvas });
export const camera = cameraRig.camera;
export const cameraBasePosition = cameraRig.basePosition;
export const cameraTarget = cameraRig.target;

export const getCameraAnimationState = () => cameraRig.getAnimationState();
export const beginCameraAnimation = () => cameraRig.beginAnimation();
export const finishCameraAnimation = (animationId) =>
  cameraRig.finishAnimation(animationId);
