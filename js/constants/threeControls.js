import { MOVEMENT_KEYS } from './movement.js';

export const CONTROL_KEYS = {
  ...MOVEMENT_KEYS,
  A: 'Enter',
  B: 'b',
  Start: 'Start',
  Select: 'Select',
};

export const BUTTON_PRESS_DEPTH = 0.02;

export const DPAD_ZONE = {
  minX: 0.02,
  maxX: 1,
  minZ: 0.02,
  maxZ: 1,
  centerX: 0.55,
  centerZ: 0.49,
  deadZone: 0.03,
};

export const ACTION_ZONE_A = {
  centerX: 0.586,
  centerZ: 0.505,
  halfSize: 0.08,
};

export const ACTION_ZONE_B = {
  centerX: 0.569,
  centerZ: 0.464,
  halfSize: 0.08,
};
export const DPAD_ROTATION_ANGLE = Math.PI * 0.05;
