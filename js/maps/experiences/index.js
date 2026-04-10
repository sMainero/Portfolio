/**
 * @import { TileMap } from '../../classes/tileMap.js';
 */
import { Portal } from '../../classes/portal.js';
import { TileMap } from '../../classes/tileMap.js';
import { TRAINER_SPRITE_SIZE } from '../../constants/player.js';
import {
  SCALED_TILE_SIZE,
  TILE_SCALING_AMOUNT,
} from '../../constants/tileset.js';
import {
  LOGOS_TILESET_NAME,
  LOGOS_TILESET_SOLID_TILE_IDS,
  RBY_TILESET_NAME,
  RBY_TILESET_SOLID_TILE_IDS,
  loadLogosTileset,
  loadRbyTileset,
} from '../../tilesets/index.js';
import { MAP_EXPERIENCES_ROOM } from './constants.js';

const [rbyTileset, logosTileset] = await Promise.all([
  loadRbyTileset(),
  loadLogosTileset(),
]);

/**
 * @extends {TileMap}
 */
export class ExperiencesRoomMap extends TileMap {
  constructor() {
    super(
      MAP_EXPERIENCES_ROOM,
      {
        [RBY_TILESET_NAME]: RBY_TILESET_SOLID_TILE_IDS,
        [LOGOS_TILESET_NAME]: LOGOS_TILESET_SOLID_TILE_IDS,
      },
      SCALED_TILE_SIZE,
      TILE_SCALING_AMOUNT,
      {
        [RBY_TILESET_NAME]: rbyTileset,
        [LOGOS_TILESET_NAME]: logosTileset,
      },
      RBY_TILESET_NAME,
      new Portal([
        {
          targetMap: 'mainRoom',
          targetX: TRAINER_SPRITE_SIZE * 3,
          targetY: TRAINER_SPRITE_SIZE * 0,
          x: TRAINER_SPRITE_SIZE * 1,
          y: TRAINER_SPRITE_SIZE * 7,
        },
      ]),
      'experiences',
    );
  }
}
