import { Vector3 } from 'three';

export const INITIAL_CAMERA_POSITION = { x: -0.8, y: 0.4, z: 2.5 };
export const DEFAULT_CAMERA_ANIMATION_DURATION = 700;
export const RESET_CAMERA_ANIMATION = {
  duration: DEFAULT_CAMERA_ANIMATION_DURATION,
  toPosition: new Vector3(-0.8, 0.4, 2.5),
  toTarget: new Vector3(0, 0, 0),
};
export const GAME_CAMERA_ANIMATION = {
  duration: DEFAULT_CAMERA_ANIMATION_DURATION,
  toPosition: new Vector3(0, 0.2, 1.3),
  toTarget: new Vector3(0, 0.2, 0),
};
