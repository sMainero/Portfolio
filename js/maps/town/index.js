/**
 * @import { TileMap } from '../../classes/tileMap.js';
 */
import { Portal } from '../../classes/portal.js';
import { TileMap } from '../../classes/tileMap.js';
import { TRAINER_SPRITE_SIZE } from '../../constants/player.js';
import { SCALED_TILE_SIZE, TILE_SCALING_AMOUNT } from '../../constants/tileset.js';
import { MAP_MAIN_TOWN } from './constants.js';
import { MAIN_TILESET_NAME, MAIN_TILESET_SOLID_TILE_IDS } from '../../tilesets/index.js';
import { getMainTileset } from '../../utils/assetPreloader.js';

/**
 * @extends {TileMap}
 */
export class TownMap extends TileMap {
  constructor() {
    super(
      MAP_MAIN_TOWN,
      {
        [MAIN_TILESET_NAME]: MAIN_TILESET_SOLID_TILE_IDS,
      },
      SCALED_TILE_SIZE,
      TILE_SCALING_AMOUNT,
      {
        [MAIN_TILESET_NAME]: getMainTileset(),
      },
      MAIN_TILESET_NAME,
      new Portal([
        {
          targetMap: 'mainRoom',
          targetX: TRAINER_SPRITE_SIZE * 6,
          targetY: TRAINER_SPRITE_SIZE * 1,
          x: TRAINER_SPRITE_SIZE * 9,

          y: TRAINER_SPRITE_SIZE,
        },
      ]),
      'town',
    );
  }
}
