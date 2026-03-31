import { startGameCourse } from './courseWay.js';
import { testThree, animateCamera } from './3d/index.js';
import {
  GAME_CAMERA_ANIMATION,
  RESET_CAMERA_ANIMATION,
} from './constants/three.js';

window.onload = () => {
  // startGame();
  startGameCourse(mainCanvas);
  testThree({ secondaryCanvas });
};

export const resetCamera = () => {
  animateCamera(RESET_CAMERA_ANIMATION);
};

export const setGameCamera = () => {
  animateCamera(GAME_CAMERA_ANIMATION);
};

window.resetCamera = resetCamera;
window.setGameCamera = setGameCamera;
console.log(resetCamera);
