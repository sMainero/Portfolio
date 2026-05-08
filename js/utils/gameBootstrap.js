import { gltfModelLoader } from '../3d/helpers/gltfLoader.js';
import { loadingManager } from './loadingManager.js';
import { preloadGameAssets, TOTAL_LOADING_SOURCES } from './assetPreloader.js';

const _preloadFont = () => {
  const onProgress = loadingManager.register('pokemonFont');
  document.fonts.load('64px Pokemon').then(() => onProgress?.(100));
};

export const preloadGames = () => {
  // Fix the denominator before any sources register — bar can only move forward.
  loadingManager.setTotal(TOTAL_LOADING_SOURCES);
  _preloadFont();
  // Start ALL remaining asset loads (images, sounds, textures) right now,
  // before the dynamic imports below resolve. This ensures every source is
  // registered with loadingManager in the same synchronous tick so the bar
  // reflects true aggregate progress and never goes backward.
  const assetPreloadPromise = preloadGameAssets();

  return {
    assetPreloadPromise,
    gameEnginePromise: import('../startGameEngine.js'),
    threeDGamePromise: import('../3d/index.js'),
  };
};

export const startGames = async (
  { assetPreloadPromise, gameEnginePromise, threeDGamePromise },
  { mainCanvas, renderCanvas },
) => {
  // Race JS module loading against asset fetching in parallel.
  // Game starts only when both the code and all assets are ready.
  const [, { startGameEngine }, { start3DGame }] = await Promise.all([
    assetPreloadPromise,
    gameEnginePromise,
    threeDGamePromise,
  ]);

  const game = startGameEngine(mainCanvas);
  start3DGame({ renderCanvas, game });
};
