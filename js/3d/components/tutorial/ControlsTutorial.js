import { Tutorial } from './Tutorial.js';

const arrowVariation = Math.random() * 1000;

/** @type {import('./Tutorial.js').TutorialStep[]} */
const CONTROLS_STEPS = [
  {
    toastText: 'Click the camera button to switch to game view!',
    toastPosition: 'bottom',
    arrowOrientation: 'downLeft',
    arrowOptions: {
      size: 0.4,
      color: 0xffffff,
      position: { x: 0.7, y: 1.5, z: 0.1 },
      variateMovement: true,
      movementVariationX: arrowVariation,
      movementVariationY: arrowVariation,
    },
    completionEvent: 'tutorial:cameraSwitch',
  },
  {
    toastText: 'Use the D-Pad (or arrow keys) to move around!',
    toastPosition: 'bottom',
    arrowOrientation: 'upLeft',
    arrowOptions: {
      size: 0.2,
      color: 0xffffff,
      position: { x: -0.15, y: -0.45, z: 0.2 },
      variateMovement: true,
      movementVariationX: arrowVariation,
      movementVariationY: arrowVariation,
    },
    completionKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  },
  {
    toastText: 'Press the A button (or Enter) near a character or object to interact!',
    toastPosition: 'bottom',
    arrowOrientation: 'upRight',
    arrowOptions: {
      size: 0.2,
      color: 0xffffff,
      position: { x: 0.25, y: -0.4, z: 0.2 },
      variateMovement: true,
      movementVariationX: arrowVariation,
      movementVariationY: arrowVariation,
    },
    completionKeys: ['Enter'],
  },
  {
    toastText: 'Press the START button (or P) to open the in-game menu!',
    toastPosition: 'top',
    completionKeys: ['p'],
    arrowOrientation: 'downRight',
    arrowOptions: {
      size: 0.2,
      color: 0xffffff,
      position: { x: -0.05, y: -0.45, z: 0.2 },
      variateMovement: true,
      movementVariationX: arrowVariation,
      movementVariationY: arrowVariation,
    },
  },
];

/**
 * ControlsTutorial — guides new users through the four core game interactions:
 *   1. Switch to game view via the camera button
 *   2. Move using the D-Pad / arrow keys
 *   3. Talk to an NPC with the A button / Enter
 *   4. Open the menu with Start / P
 */
export class ControlsTutorial extends Tutorial {
  constructor() {
    super('controls', CONTROLS_STEPS);
  }
}
