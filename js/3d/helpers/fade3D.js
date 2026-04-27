import { FADE_DURATION } from './cameraButtonState.js';

/**
 * Fade HTML camera controls and optionally run a callback after the fade duration.
 * @param {number} targetOpacity
 * @param {(() => void)=} onComplete
 * @returns {void}
 */
export const fadeHtmlControls = (targetOpacity, onComplete) => {
  const htmlControls = document.getElementById('htmlCameraControls');
  if (!htmlControls) {
    onComplete?.();
    return;
  }

  if (targetOpacity === 0) {
    htmlControls.classList.add('is-hidden');
  } else {
    htmlControls.classList.remove('is-hidden');
  }

  if (onComplete) {
    setTimeout(onComplete, FADE_DURATION);
  }
};
