/**
 * @import { TileMap } from '../../classes/tileMap.js';
 */
import { Portal } from '../../classes/portal.js';
import { TileMap } from '../../classes/tileMap.js';
import { EventTrigger } from '../../classes/eventTrigger.js';
import { TRAINER_SPRITE_SIZE } from '../../constants/player.js';
import {
  SCALED_TILE_SIZE,
  TILE_SCALING_AMOUNT,
} from '../../constants/tileset.js';
import { MAP_MAIN_ROOM } from './constants.js';
import {
  COMPLETE_TILESET_NAME,
  COMPLETE_TILESET_SOLID_TILE_IDS,
  RBY_TILESET_NAME,
  RBY_TILESET_SOLID_TILE_IDS,
  loadCompleteTileset,
  loadRbyTileset,
} from '../../tilesets/index.js';

const [rbyTileset, completeTileset] = await Promise.all([
  loadRbyTileset(),
  loadCompleteTileset(),
]);

/**
 * @extends {TileMap}
 */
export class MainRoomMap extends TileMap {
  constructor() {
    super(
      MAP_MAIN_ROOM,
      {
        [RBY_TILESET_NAME]: RBY_TILESET_SOLID_TILE_IDS,
        [COMPLETE_TILESET_NAME]: COMPLETE_TILESET_SOLID_TILE_IDS,
      },
      SCALED_TILE_SIZE,
      TILE_SCALING_AMOUNT,
      {
        [RBY_TILESET_NAME]: rbyTileset,
        [COMPLETE_TILESET_NAME]: completeTileset,
      },
      RBY_TILESET_NAME,
      new Portal([
        {
          targetMap: 'town',
          targetX: TRAINER_SPRITE_SIZE * 9,
          targetY: TRAINER_SPRITE_SIZE * 1,
          x: TRAINER_SPRITE_SIZE * 6,

          y: TRAINER_SPRITE_SIZE,
        },
        {
          targetMap: 'experiences',
          targetX: TRAINER_SPRITE_SIZE * 1,
          targetY: TRAINER_SPRITE_SIZE * 6,
          x: TRAINER_SPRITE_SIZE * 3,

          y: TRAINER_SPRITE_SIZE * 0,
        },
      ]),
      'mainRoom',
      [
        new EventTrigger({
          name: 'computer',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 1 },
          ],
          action: 'dialog',
          dialog: 'This is my computer... it is the best computer in town...',
        }),
        new EventTrigger({
          name: 'experiencesRoomSign',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 0 },
          ],
          action: 'dialog',
          dialog: '"Experiences Room"',
        }),
      ],
    );
  }
}
