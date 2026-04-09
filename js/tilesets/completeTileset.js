import { createTileBuilder } from '../utils/tileReference.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { sharedLoader } from '../utils/assetLoader.js';

export const COMPLETE_TILESET_NAME = 'complete';
export const COMPLETE_TILESET_TILE_SIZE = 16;

export const COMPLETE_TILESET_SOLID_TILE_IDS = new Set([5056, 5057]);

export const loadCompleteTileset = async () => {
  await sharedLoader.loadImage(
    COMPLETE_TILESET_NAME,
    `${ASSETS_BASE}gen-1-complete-tileset.png`,
  );

  const image = sharedLoader.get(COMPLETE_TILESET_NAME);

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    tileSize: COMPLETE_TILESET_TILE_SIZE,
    tilesPerSheetRow: Math.floor(
      image.naturalWidth / COMPLETE_TILESET_TILE_SIZE,
    ),
  };
};

export const completeTileBuilder = createTileBuilder(COMPLETE_TILESET_NAME);
