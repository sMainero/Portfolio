import { createTileBuilder } from '../utils/tileReference.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { sharedLoader } from '../utils/assetLoader.js';

export const RBY_TILESET_NAME = 'tileset';
export const RBY_TILESET_TILE_SIZE = 8;
export const RBY_TILESET_TILES_PER_SHEET_ROW = 16;

export const RBY_TILESET_SOLID_TILE_IDS = new Set([
  //-2 would be a black tile
  -2, 0, 2, 3, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
  69, 70, 71,
]);

export const rbyTileBuilder = createTileBuilder(RBY_TILESET_NAME);

export const loadRbyTileset = async () => {
  await sharedLoader.loadImage(
    RBY_TILESET_NAME,
    `${ASSETS_BASE}Pokemon_RBY_Tile_Set_01.png`,
  );

  const image = sharedLoader.get(RBY_TILESET_NAME);

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    tileSize: RBY_TILESET_TILE_SIZE,
    tilesPerSheetRow: RBY_TILESET_TILES_PER_SHEET_ROW,
  };
};
