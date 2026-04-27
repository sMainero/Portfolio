import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadingManager } from '../../utils/loadingManager.js';
import { ASSETS_BASE } from '../../constants/assets.js';

/**
 *
 * Singleton instance — initialised once, then importable anywhere.
 * @type {GltfModelLoader | null}
 */
let _instance = null;

/**
 * Class responsible for loading GLTF models and tracking their loading state.
 * Models can be requested by name, and the loader will return a promise that
 * resolves with the loaded model. The loader ensures that each model is only
 * loaded once, and subsequent requests for the same model will return the same
 * promise.
 *
 * Usage:
 *   const gltfLoader = GltfModelLoader.init();
 *   const gameboyModel = await gltfLoader.loadModel('gameboy');
 * @property {GLTFLoader} loader - The GLTFLoader instance used to load models.
 * @property {Object} unloadedModels - A mapping of model names to their file paths for models that have not yet been loaded.
 * @property {Object} loadedModels - A mapping of model names to their loaded GLTF data for models that have been loaded.
 * @property {Object} loadingPromises - A mapping of model names to their loading promises, ensuring that each model is only loaded once.
 * @property {number} progress - The loading progress of the models.

 */
export class GltfModelLoader {
  /**
   * Initialize loader and model registries.
   */
  constructor() {
    this.progress = 0;
    this.loader = new GLTFLoader();
    this.unloadedModels = {
      gameboy: `${ASSETS_BASE}/models/GBC.glb`,
      // gameboy: `${ASSETS_BASE}/models/GBC_complete_file.glb`,
    };
    this.loadedModels = {};
    this.loadingPromises = {};
  }

  /**
   * Load and cache a model by key.
   * @param {string} modelName
   * @returns {Promise<import('three/examples/jsm/loaders/GLTFLoader').GLTF>}
   */
  loadModel(modelName) {
    if (this.loadingPromises[modelName]) {
      return this.loadingPromises[modelName];
    }
    const onProgress = loadingManager.register(modelName);
    const promise = new Promise((resolve, reject) => {
      const modelPath = this.unloadedModels[modelName];

      if (!modelPath) {
        reject(new Error(`Model "${modelName}" not found in unloaded models.`));
        return;
      }
      this.loader.load(
        modelPath,
        (gltf) => {
          this.loadedModels[modelName] = gltf;
          delete this.unloadedModels[modelName];
          onProgress(100);
          resolve(gltf);
        },
        (xhr) => {
          if (xhr.total > 0) {
            onProgress((xhr.loaded / xhr.total) * 100);
          }
        },
        (error) => {
          console.error(`[GltfModelLoader] Failed to load "${modelName}":`, error);
          reject(error);
        },
      );
    });
    this.loadingPromises[modelName] = promise;
    return promise;
  }

  /**
   * Initialize singleton loader instance.
   * @returns {GltfModelLoader}
   */
  static init() {
    if (!_instance) _instance = new GltfModelLoader();
    return _instance;
  }
}

GltfModelLoader.init();
/** Shared GltfModelLoader — available after Game has been constructed. */
export const gltfModelLoader = {
  get instance() {
    return _instance;
  },
};
