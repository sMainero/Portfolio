import { TILE_SIZE } from '../constants/game.js';
import { SCALED_TILE_SIZE, TILE_SCALING_AMOUNT } from '../constants/tileset.js';
import { AssetLoader } from '../utils/assetLoader.js';
import { ASSETS_BASE } from '../constants/assets.js';

// Tile IDs from the Pokemon RBY tileset that block movement.
// Extend this set as you add more solid tile types from your tileset.
const SOLID_TILE_IDS = new Set([
  0, 2, 3, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  70, 71,

  //STAIRS
  10, 11, 12, 13, 26, 27, 28, 29,
]);

// The RBY tileset image is 10 tiles wide (80px at 8px per tile)
const TILES_PER_SHEET_ROW = 16;

const loader = new AssetLoader();
await loader.loadImage('tileset', `${ASSETS_BASE}Pokemon_RBY_Tile_Set_01.png`);

export class TileMap {
  constructor(mapData) {
    this.mapData = mapData; // 2D array [row][col] of tile IDs
    this.rows = mapData.length;
    this.cols = mapData[0].length;
    this.tileset = loader.get('tileset');
  }

  // Returns true if the world-space bounding box overlaps any solid tile.
  // worldX/worldY is the top-left corner; width/height is the bounding box size.
  isSolid(worldX, worldY, width, height) {
    const tileLeft = Math.floor(worldX / SCALED_TILE_SIZE);

    const tileTop = Math.floor(worldY / SCALED_TILE_SIZE);
    const tileRight = Math.floor((worldX + width - 1) / SCALED_TILE_SIZE);

    const tileBottom = Math.floor((worldY + height - 1) / SCALED_TILE_SIZE);

    for (let r = tileTop; r <= tileBottom; r++) {
      for (let c = tileLeft; c <= tileRight; c++) {
        // Treat out-of-bounds as solid
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return true;
        if (SOLID_TILE_IDS.has(this.mapData[r][c])) return true;
      }
    }
    return false;
  }

  draw(context) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        context.save();
        context.scale(
          TILE_SCALING_AMOUNT, //because trainer takes up 2 horizontal tiles
          TILE_SCALING_AMOUNT, //because trainer takes up 2 vertical tiles
        );
        const tileId = this.mapData[r][c];
        const srcX = (tileId % TILES_PER_SHEET_ROW) * TILE_SIZE;
        const srcY = Math.floor(tileId / TILES_PER_SHEET_ROW) * TILE_SIZE;
        context.drawImage(
          this.tileset,
          srcX,
          srcY,
          TILE_SIZE,
          TILE_SIZE,
          c * TILE_SIZE,
          r * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );

        // // Draw tile ID label
        // context.font = `${TILE_SIZE * 0.6}px monospace`;
        // context.fillStyle = 'cyan';
        // context.lineWidth = 1.5 / TILE_SCALING_AMOUNT;
        // context.strokeStyle = 'black';
        // const label = String(tileId);
        // const labelX = c * TILE_SIZE + TILE_SIZE / 2;
        // const labelY = r * TILE_SIZE + TILE_SIZE * 0.7;
        // context.textAlign = 'center';
        // context.strokeText(label, labelX, labelY);
        // context.fillText(label, labelX, labelY);

        context.restore();
      }
    }
  }
}
