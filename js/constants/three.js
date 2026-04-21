import { Vector3 } from 'three';

export const INITIAL_CAMERA_POSITION = { x: -0.8, y: 0.4, z: 3.5 };
export const DEFAULT_CAMERA_ANIMATION_DURATION = 700;
export const RESET_CAMERA_ANIMATION = {
  duration: DEFAULT_CAMERA_ANIMATION_DURATION,
  toPosition: new Vector3(
    INITIAL_CAMERA_POSITION.x,
    INITIAL_CAMERA_POSITION.y,
    INITIAL_CAMERA_POSITION.z,
  ),
  toTarget: new Vector3(0, 0, 0),
};
export const GAME_CAMERA_ANIMATION = {
  duration: DEFAULT_CAMERA_ANIMATION_DURATION,
  toPosition: new Vector3(0, 0.12, 1.75),
  toTarget: new Vector3(0, 0.12, 0),
};
