/**
 * Syncs the speaker button's active (muted) state with the sfxPlayer.
 * @returns {void}
 */
const _syncMuteState = () => {
  const btn = document.getElementById('speakerToggleButton');
  const muted = Boolean(window.sfxPlayer?.isMuted);
  btn?.classList.toggle('is-active', muted);
};

/**
 * Sets up the speaker mute button.
 * Exposes `window.onSpeakerClick` for use as an onclick handler.
 * @returns {void}
 */
export const setupMuteButton = () => {
  window.onSpeakerClick = () => {
    window.toggleSoundMute?.();
    _syncMuteState();
  };
};
