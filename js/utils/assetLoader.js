import { loadingManager } from './loadingManager.js';

let _imageTotal = 0;
let _imageLoaded = 0;
const _onImagesProgress = loadingManager.register('images');

/**
 * In-memory image cache with loading helpers.
 */
export class AssetLoader {
  /**
   * Initialize empty image cache.
   */
  constructor() {
    this.images = {};
  }

  /**
   * Load an image and store it in cache by key.
   * @param {string} key
   * @param {string} src
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(key, src) {
    // Dedup: if already loaded, return immediately without a new fetch
    if (this.images[key]) return Promise.resolve(this.images[key]);

    _imageTotal++;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        _imageLoaded++;
        _onImagesProgress((_imageLoaded / _imageTotal) * 100);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  /**
   * Load multiple images in parallel.
   * @param {{ key: string, src: string }[]} imageList
   * @returns {Promise<Record<string, HTMLImageElement>>}
   */
  async loadAll(imageList) {
    const promises = imageList.map(({ key, src }) => this.loadImage(key, src));
    await Promise.all(promises);
    return this.images;
  }

  /**
   * Get a cached image by key.
   * @param {string} key
   * @returns {HTMLImageElement}
   */
  get(key) {
    return this.images[key];
  }
}

// Shared singleton — imported by all modules that need assets.
// ES modules guarantee this is evaluated once, so all consumers
// share the same cache and images are never fetched more than once.
/** @type {AssetLoader} */
export const sharedLoader = new AssetLoader();
