import { FADE_DURATION } from './cameraButtonState.js';
import { syncCameraButtonState } from '../../utils/cameraButton.js';

/**
 * Sync the HTML camera button active state and optionally run a callback after the fade duration.
 * @param {number} targetOpacity - 1 = game mode (active/filled), 0 = reset mode (unfilled)
 * @param {(() => void)=} onComplete
 * @returns {void}
 */
export const fadeHtmlControls = (targetOpacity, onComplete) => {
  syncCameraButtonState(targetOpacity === 1);

  if (onComplete) {
    setTimeout(onComplete, FADE_DURATION);
  }
};
