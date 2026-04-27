import { sharedSoundLoader } from '../../utils/soundLoader.js';

/**
 * Resumes the shared AudioContext inside a confirmed user gesture.
 * Call this once from a click/touch handler to lift the autoplay restriction.
 */
export const unlockAudio = () => sharedSoundLoader.unlock();

/**
 * Generic audio buffer player with per-sound throttling.
 * Buffers are stored and retrieved via sharedSoundLoader — this class only
 * manages play state (muting, per-sound intervals).
 */
export class SoundPlayer {
  /**
   * Initialize throttle state maps.
   */
  constructor() {
    /** @type {Map<string, number>} minimum ms between plays, per sound */
    this._intervals = new Map();
    /** @type {Map<string, number>} earliest timestamp (ms) a sound may play again */
    this._nextAllowed = new Map();
    this.muted = false;
  }

  /**
   * Load an audio file via sharedSoundLoader and register its play interval.
   * @param {string} name - key used in play()
   * @param {string} url  - full URL/path to the audio file
   * @param {number} [interval=0] - minimum ms between repeated plays of this sound
   * @returns {Promise<void>}
   */
  async loadSound(name, url, interval = 0) {
    await sharedSoundLoader.load(name, url);
    this._intervals.set(name, interval);
  }

  /**
   * Play a pre-loaded sound by name.
   * Each sound has its own independent throttle — playing one never blocks another.
   * @param {string} name
   */
  play(name) {
    if (this.muted) return;

    const ctx = sharedSoundLoader.audioContext;
    if (ctx.state !== 'running') return;

    const buffer = sharedSoundLoader.get(name);
    if (!buffer) return;

    const interval = this._intervals.get(name) ?? 0;
    if (interval > 0) {
      const now = Date.now();
      if (now < (this._nextAllowed.get(name) ?? 0)) return;
      // Reserve the slot before starting playback to prevent double-fires
      this._nextAllowed.set(name, now + interval);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  /**
   * Toggle muted playback state.
   * @returns {void}
   */
  toggleMute() {
    this.muted = !this.muted;
  }
}
