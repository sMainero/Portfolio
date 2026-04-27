/**
 * Syncs the camera button's filled/active state.
 * Call with `true` when entering game mode, `false` when resetting.
 * @param {boolean} isGameMode
 * @returns {void}
 */
export const syncCameraButtonState = (isGameMode) => {
  const btn = document.getElementById('htmlCameraControls');
  btn?.classList.toggle('is-active', isGameMode);
};
