import { cameraButtonState, FADE_START_DELAY } from './cameraButtonState.js';
import { gameCameraAnimation } from './gameCameraAnimation.js';
import { fadeHtmlControls } from './fade3D.js';
import { DEFAULT_CAMERA_ANIMATION_DURATION } from '../../constants/three.js';

export const switchToGame = () => {
  gameCameraAnimation();
  cameraButtonState.cameraMode = 'game';
  window.dispatchEvent(new CustomEvent('tutorial:cameraSwitch'));
  // Enter game mode after the camera animation finishes — skips all 3D world
  // work (particles, motion, raycasting) but keeps the canvas texture live.
  // setTimeout(() => {
  //   window.enterGameMode3D?.();
  // }, DEFAULT_CAMERA_ANIMATION_DURATION + 50);
  setTimeout(() => {
    fadeHtmlControls(1);
  }, FADE_START_DELAY);
};
