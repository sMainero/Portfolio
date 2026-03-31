import { PerspectiveCamera, Vector3 } from 'three';

import { INITIAL_CAMERA_POSITION } from '../../constants/three.js';

export const camera = new PerspectiveCamera(
  60,
  secondaryCanvas.clientWidth / secondaryCanvas.clientHeight,
  0.1,
  10,
);
camera.position.set(
  INITIAL_CAMERA_POSITION.x,
  INITIAL_CAMERA_POSITION.y,
  INITIAL_CAMERA_POSITION.z,
);
export const cameraBasePosition = new Vector3(
  INITIAL_CAMERA_POSITION.x,
  INITIAL_CAMERA_POSITION.y,
  INITIAL_CAMERA_POSITION.z,
);
export const cameraTarget = new Vector3(0, 0, 0);

const animationState = {
  isAnimating: false,
  activeAnimationId: 0,
};

export const getCameraAnimationState = () => animationState;

export const beginCameraAnimation = () => {
  animationState.activeAnimationId += 1;
  animationState.isAnimating = true;
  return animationState.activeAnimationId;
};

export const finishCameraAnimation = (animationId) => {
  if (animationState.activeAnimationId === animationId) {
    animationState.isAnimating = false;
  }
};
