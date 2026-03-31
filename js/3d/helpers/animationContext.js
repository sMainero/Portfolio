import {
  beginCameraAnimation,
  cameraBasePosition,
  cameraTarget,
  finishCameraAnimation,
  getCameraAnimationState,
} from '../camera/camera.js';
import { controls } from '../controls/controls.js';

export const animationContext = {
  controls,
  cameraBasePosition,
  cameraTarget,
  beginCameraAnimation,
  finishCameraAnimation,
  getCameraAnimationState,
};