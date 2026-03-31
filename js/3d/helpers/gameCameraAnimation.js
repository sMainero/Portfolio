import { GAME_CAMERA_ANIMATION } from '../../constants/three.js';
import { animateCamera } from './animateCamera.js';
import { animationContext } from './animationContext.js';
import { disableMovement } from './cursorController.js';

export const gameCameraAnimation = () => {
  disableMovement();
  animateCamera({
    ...GAME_CAMERA_ANIMATION,
    ...animationContext,
  });
};
