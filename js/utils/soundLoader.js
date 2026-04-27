import { loadingManager } from './loadingManager.js';

// Shared AudioContext — one per page, never closed.
// Created at module evaluation time so the instance exists before the first
// user gesture; it starts suspended and is resumed by unlock().
const _ctx = new (window.AudioContext || window.webkitAudioContext)();

const _onCtxUnlock = async () => {
  if (_ctx.state === 'suspended') await _ctx.resume();
  if (_ctx.state === 'running') {
    window.removeEventListener('keydown', _onCtxUnlock);
    window.removeEventListener('pointerdown', _onCtxUnlock);
  }
};
window.addEventListener('keydown', _onCtxUnlock);
window.addEventListener('pointerdown', _onCtxUnlock);

/**
 * Audio buffer loader and cache. Fetches, decodes, and stores AudioBuffers
 * keyed by name. Deduplicates concurrent loads for the same key.
 */
export class SoundLoader {
  constructor() {
    /** @type {Map<string, AudioBuffer>} */
    this._buffers = new Map();
    /** @type {Map<string, Promise<AudioBuffer | null>>} */
    this._promises = new Map();
  }

  /**
   * Fetch, decode, and cache an audio file. Safe to call multiple times —
   * subsequent calls for the same key return the existing promise.
   * @param {string} key
   * @param {string} url
   * @returns {Promise<AudioBuffer | null>}
   */
  load(key, url) {
    if (this._promises.has(key)) return this._promises.get(key);

    const onProgress = loadingManager.register(`sound:${key}`);
    const promise = (async () => {
      try {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await _ctx.decodeAudioData(arrayBuffer);
        this._buffers.set(key, buffer);
        onProgress?.(100);
        return buffer;
      } catch (e) {
        onProgress?.(100);
        console.error(`SoundLoader: failed to load "${key}":`, e);
        return null;
      }
    })();

    this._promises.set(key, promise);
    return promise;
  }

  /**
   * Get a cached AudioBuffer by key. Returns undefined if not yet loaded.
   * @param {string} key
   * @returns {AudioBuffer | undefined}
   */
  get(key) {
    return this._buffers.get(key);
  }

  /** @returns {AudioContext} */
  get audioContext() {
    return _ctx;
  }

  /**
   * Resume the AudioContext — call inside a confirmed user gesture to lift
   * browser autoplay restrictions.
   * @returns {Promise<void>}
   */
  unlock() {
    return _ctx.resume();
  }
}

/** @type {SoundLoader} */
export const sharedSoundLoader = new SoundLoader();
