import { renderer } from '../components/renderer/renderer.js';
import { createPhoneMotion } from './phoneMotion.js';

// createPhoneMotion is synchronous — no await needed.
export const { motion, isMotionEnabled, enablePhoneMotion, disablePhoneMotion } = createPhoneMotion(
  {
    domElement: renderer.domElement,
  },
);
