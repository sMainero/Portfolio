import { renderScreen } from './3d/index.js';
import { resetCameraAnimation } from './3d/helpers/resetCameraAnimation.js';
import { gameCameraAnimation } from './3d/helpers/gameCameraAnimation.js';
import { startGame } from './startGame.js';

window.onload = () => {
  // startGame();
  startGame(mainCanvas);
  renderScreen({ renderCanvas });
};

export const resetCamera = () => {
  resetCameraAnimation();
};

export const setGameCamera = () => {
  gameCameraAnimation();
};

window.resetCamera = resetCamera;
window.setGameCamera = setGameCamera;
console.log(resetCamera);
