const _enterFullscreen = () => {
  if (document.documentElement.requestFullscreen) {
    return document.documentElement.requestFullscreen();
  }
  if (document.documentElement.webkitRequestFullscreen) {
    return document.documentElement.webkitRequestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen is not supported'));
};

const _exitFullscreen = () => {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  return Promise.resolve();
};

const _isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);

const _syncState = () => {
  const btn = document.getElementById('fullscreenToggleButton');
  btn?.classList.toggle('is-active', _isFullscreen());
};

/**
 * Toggles browser fullscreen mode and syncs the button active state.
 * Exposed as `window.toggleFullscreen` for use as an onclick handler.
 * @returns {Promise<void>}
 */
export const toggleFullscreen = async () => {
  try {
    if (_isFullscreen()) {
      await _exitFullscreen();
    } else {
      await _enterFullscreen();
    }
  } catch (_) {}
  _syncState();
};

/**
 * Sets up the fullscreen button.
 * Exposes `window.toggleFullscreen` and registers fullscreen change listeners.
 * @returns {void}
 */
export const setupFullscreenButton = () => {
  window.toggleFullscreen = toggleFullscreen;
  document.addEventListener('fullscreenchange', _syncState);
  document.addEventListener('webkitfullscreenchange', _syncState);
  _syncState();
};
