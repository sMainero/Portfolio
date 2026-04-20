import { createTileBuilder } from '../utils/tileReference.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { sharedLoader } from '../utils/assetLoader.js';

export const LOGOS_TILESET_NAME = 'logos';
export const LOGOS_TILESET_TILE_SIZE = 16;
export const LOGOS_TILESET_TILES_PER_SHEET_ROW = 6;

export const logosTileBuilder = createTileBuilder(LOGOS_TILESET_NAME);

export const LOGOS_TILESET_SOLID_TILE_IDS = new Set([
  //-2 would be a black tile
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
]);

export const loadLogosTileset = async () => {
  await sharedLoader.loadImage(
    LOGOS_TILESET_NAME,
    `${ASSETS_BASE}tilesets/logosTileset.png`,
  );

  const image = sharedLoader.get(LOGOS_TILESET_NAME);

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    tileSize: LOGOS_TILESET_TILE_SIZE,
    tilesPerSheetRow: LOGOS_TILESET_TILES_PER_SHEET_ROW,
  };
};
