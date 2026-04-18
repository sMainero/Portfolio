// Shared AudioContext — one per page, never closed.
// Must be created before the first user gesture so the instance exists;
// it starts suspended and is resumed inside the gesture handler below.
const _ctx = new (window.AudioContext || window.webkitAudioContext)();

const _unlockCtx = async () => {
  if (_ctx.state === 'suspended') await _ctx.resume();
  if (_ctx.state === 'running') {
    window.removeEventListener('keydown', _unlockCtx);
    window.removeEventListener('pointerdown', _unlockCtx);
  }
};
window.addEventListener('keydown', _unlockCtx);
window.addEventListener('pointerdown', _unlockCtx);

/**
 * Resumes the shared AudioContext inside a confirmed user gesture.
 * Call this once from a click/touch handler to lift the autoplay restriction.
 */
export const unlockAudio = () => _ctx.resume();

export class SoundPlayer {
  constructor() {
    /** @type {Map<string, AudioBuffer>} pre-decoded buffers */
    this._buffers = new Map();
    /** @type {Map<string, number>} minimum ms between plays, per sound */
    this._intervals = new Map();
    /** @type {Map<string, number>} earliest timestamp (ms) a sound may play again */
    this._nextAllowed = new Map();
    this.muted = false;
  }

  /**
   * Fetch, decode, and cache an audio file as an AudioBuffer.
   * Call this eagerly (at startup) so there is no decode delay on first play.
   * @param {string} name - key used in play()
   * @param {string} url  - full URL/path to the audio file
   * @param {number} [interval=0] - minimum ms between repeated plays of this sound
   */
  async loadSound(name, url, interval = 0) {
    try {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await _ctx.decodeAudioData(arrayBuffer);
      this._buffers.set(name, audioBuffer);
      this._intervals.set(name, interval);
    } catch (e) {
      console.error(`SoundPlayer: failed to load "${name}":`, e);
    }
  }

  /**
   * Play a pre-loaded sound by name.
   * Each sound has its own independent throttle — playing one never blocks another.
   * @param {string} name
   */
  play(name) {
    if (this.muted) return;
    if (_ctx.state !== 'running') return;

    const buffer = this._buffers.get(name);
    if (!buffer) return;

    const interval = this._intervals.get(name) ?? 0;
    if (interval > 0) {
      const now = Date.now();
      if (now < (this._nextAllowed.get(name) ?? 0)) return;
      // Reserve the slot before starting playback to prevent double-fires
      this._nextAllowed.set(name, now + interval);
    }

    const source = _ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(_ctx.destination);
    source.start(0);
  }

  toggleMute() {
    this.muted = !this.muted;
  }
}
