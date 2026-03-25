import { ASSETS_BASE } from '../../constants/assets.js';

const SOUNDS_PATH = `${ASSETS_BASE}sounds`;

/**
 * @typedef {{ audio: HTMLAudioElement, interval: number }} SoundEntry
 * @typedef {Object.<string, SoundEntry>} SoundMap
 */
export class SoundPlayer {
  constructor(anchorElement = window) {
    /** @type {SoundMap} */
    this.sounds = {};
    this.isPlaying = false;

    // Once AudioContext.resume() is called inside a user gesture, the browser
    // lifts the autoplay restriction for the whole page — including HTMLAudioElement
    // calls made later from requestAnimationFrame callbacks.

    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const unlock = async () => {
      if (this._audioCtx.state === 'suspended') {
        await this._audioCtx.resume();
      }

      // Only stop listening once the context is actually running
      if (this._audioCtx.state === 'running') {
        anchorElement.removeEventListener('keydown', unlock);
        anchorElement.removeEventListener('pointerdown', unlock);
      }
    };
    anchorElement.addEventListener('keydown', unlock);
    anchorElement.addEventListener('pointerdown', unlock);
  }
  /**
   * @param {string} name - name of the sound to load, must be the same name as the file, no extension.
   */
  loadSound(name, interval = 0) {
    const audio = new Audio(`${SOUNDS_PATH}/${name}.mp3`);
    audio.load();

    this.sounds[name] = { audio, interval };
  }
  /**
   * @param {string} sound - name of the sound to play, must be the same name as the file, no extension.
   * all sounds should be .mp3 files located in the `SOUNDS_PATH` directory
   * @example
   * 'bump' for 'bump.mp3'
   */
  play(sound) {
    if (this.isPlaying) return;
    if (this.sounds[sound]) {
      this.sounds[sound].audio.currentTime = 0; // Rewind to start
      this._play(this.sounds[sound].audio, this.sounds[sound].interval);
      return;
    }
    this.loadSound(sound);
    this._play(this.sounds[sound].audio, this.sounds[sound].interval);
    return;
  }

  /**
   * @param {HTMLAudioElement} sound
   * @param {number} interval
   */
  _play(sound, interval = 0) {
    if (this._audioCtx.state === 'suspended') {
      console.error(`Audio context is still suspended. Cannot play sound.`);

      if (interval > 0) {
        this.isPlaying = true; // Prevent further play attempts until context is resumed
        this._isPlayingLoop(interval);
        return;
      }
    } // Don't attempt to play if context is still suspended

    this.isPlaying = true;
    sound.play().catch((error) => {
      console.error(`Failed to play sound "${sound.src}":`, error);
    });
    sound.onended = () => {
      this._isPlayingLoop(interval);
    };
  }

  _isPlayingLoop(interval) {
    return interval > 0
      ? setTimeout(() => {
          this.isPlaying = false;
        }, interval)
      : (this.isPlaying = false);
  }
}
