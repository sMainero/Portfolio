import { renderer } from '../renderer/renderer.js';
import { createCursorMovement } from './cursorMovement.js';

export const { cursor, enableMovement, disableMovement } = createCursorMovement({
  domElement: renderer.domElement,
});