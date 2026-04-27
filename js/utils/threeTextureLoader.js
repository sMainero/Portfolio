import * as THREE from 'three';
import { loadingManager } from './loadingManager.js';

/**
 * THREE.Texture loader and cache. Deduplicates concurrent loads for the same key.
 */
export class ThreeTextureLoader {
  constructor() {
    /** @type {Record<string, THREE.Texture>} */
    this._textures = {};
    /** @type {Record<string, Promise<THREE.Texture>>} */
    this._promises = {};
    this._loader = new THREE.TextureLoader();
  }

  /**
   * Load and cache a THREE.Texture. Safe to call multiple times — subsequent
   * calls for the same key return the existing promise.
   * @param {string} key
   * @param {string} url
   * @param {{ magFilter?: THREE.MagnificationTextureFilter, colorSpace?: string }} [options]
   * @returns {Promise<THREE.Texture>}
   */
  load(key, url, options = {}) {
    if (this._promises[key]) return this._promises[key];

    const onProgress = loadingManager.register(`texture:${key}`);
    const promise = new Promise((resolve) => {
      this._loader.load(
        url,
        (texture) => {
          if (options.magFilter !== undefined) texture.magFilter = options.magFilter;
          if (options.colorSpace !== undefined) texture.colorSpace = options.colorSpace;
          this._textures[key] = texture;
          onProgress?.(100);
          resolve(texture);
        },
        (xhr) => {
          if (xhr.total > 0) onProgress?.((xhr.loaded / xhr.total) * 100);
        },
      );
    });

    this._promises[key] = promise;
    return promise;
  }

  /**
   * Get a cached texture by key. Returns undefined if not yet loaded.
   * @param {string} key
   * @returns {THREE.Texture | undefined}
   */
  get(key) {
    return this._textures[key];
  }
}

/** @type {ThreeTextureLoader} */
export const sharedTextureLoader = new ThreeTextureLoader();
