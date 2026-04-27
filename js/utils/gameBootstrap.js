import { gltfModelLoader } from '../3d/helpers/gltfLoader.js';
import { loadingManager } from './loadingManager.js';

const _preloadFont = () => {
  const onProgress = loadingManager.register('pokemonFont');
  document.fonts.load('64px Pokemon').then(() => onProgress?.(100));
};

export const preloadGames = () => {
  _preloadFont();
  // Start the GLTF model download immediately for maximum parallelism.
  // assetPreloader.js will await the same promise (GltfModelLoader deduplicates).
  gltfModelLoader.instance.loadModel('gameboy');

  return {
    gameEnginePromise: import('../startGameEngine.js'),
    threeDGamePromise: import('../3d/index.js'),
  };
};

export const startGames = async (
  { gameEnginePromise, threeDGamePromise },
  { mainCanvas, renderCanvas },
) => {
  const [{ startGameEngine }, { start3DGame }] = await Promise.all([
    gameEnginePromise,
    threeDGamePromise,
  ]);

  const game = startGameEngine(mainCanvas);
  start3DGame({ renderCanvas, game });
};
