import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { loadingManager } from '../../../../utils/loadingManager.js';

const _loader = new FontLoader();
/** @type {import('three/examples/jsm/loaders/FontLoader').Font | null} */
let _cachedFont = null;
/** @type {Promise<import('three/examples/jsm/loaders/FontLoader').Font> | null} */
let _loadPromise = null;

/** @returns {import('three/examples/jsm/loaders/FontLoader').Font | null} */
export const getPokemonFont = () => _cachedFont;

/** @returns {Promise<import('three/examples/jsm/loaders/FontLoader').Font>} */
export const loadPokemonFont = () => {
  if (_loadPromise) return _loadPromise;

  const onProgress = loadingManager.register('pokemonFont');

  _loadPromise = new Promise((resolve, reject) => {
    _loader.load(
      'js/3d/components/text/fonts/typefaces/pokemon-font_Regular.json',
      (font) => {
        _cachedFont = font;
        onProgress?.(100);
        resolve(font);
      },
      (xhr) => {
        if (xhr.total > 0) onProgress?.((xhr.loaded / xhr.total) * 100);
      },
      (err) => reject(err),
    );
  });

  return _loadPromise;
};
