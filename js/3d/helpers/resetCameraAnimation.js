import { RESET_CAMERA_ANIMATION } from '../../constants/three.js';
import { animateCamera } from './animateCamera.js';
import { animationContext } from './animationContext.js';
import { enableMovement } from './cursorController.js';

export const resetCameraAnimation = () => {
  enableMovement();
  animateCamera({
    ...RESET_CAMERA_ANIMATION,
    ...animationContext,
  });
};
