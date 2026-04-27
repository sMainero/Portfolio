/**
 * @import { TileMap } from '../../classes/tileMap.js';
 */
import { Portal } from '../../classes/portal.js';
import { TileMap } from '../../classes/tileMap.js';
import { EventTrigger } from '../../classes/eventTrigger.js';
import { TRAINER_SPRITE_SIZE } from '../../constants/player.js';
import { SCALED_TILE_SIZE, TILE_SCALING_AMOUNT } from '../../constants/tileset.js';
import { MAP_MAIN_ROOM } from './constants.js';
import { MAIN_TILESET_NAME, MAIN_TILESET_SOLID_TILE_IDS } from '../../tilesets/index.js';
import { getMainTileset } from '../../utils/assetPreloader.js';

/**
 * @extends {TileMap}
 */
export class MainRoomMap extends TileMap {
  constructor() {
    super(
      MAP_MAIN_ROOM,
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
        // {
        //   targetMap: 'town',
        //   targetX: TRAINER_SPRITE_SIZE * 9,
        //   targetY: TRAINER_SPRITE_SIZE * 1,
        //   x: TRAINER_SPRITE_SIZE * 6,

        //   y: TRAINER_SPRITE_SIZE,
        // },
        {
          targetMap: 'experiences',
          targetX: TRAINER_SPRITE_SIZE * 2,
          targetY: TRAINER_SPRITE_SIZE * 10,
          x: TRAINER_SPRITE_SIZE * 3,

          y: TRAINER_SPRITE_SIZE * 0,
        },
      ]),
      'mainRoom',
      [
        new EventTrigger({
          name: 'computer',
          positions: [{ x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 1 }],
          action: 'dialog',
          dialog: `It's a MapBoox N3 Ultra...\n Looks decent.`,
        }),
        new EventTrigger({
          name: 'experiencesRoomSign',
          positions: [{ x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 0 }],
          action: 'dialog',
          dialog: '"Trophy Room"',
        }),
        new EventTrigger({
          name: 'experiencesRoomSign',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 3, y: TRAINER_SPRITE_SIZE * 3 },
            { x: TRAINER_SPRITE_SIZE * 3, y: TRAINER_SPRITE_SIZE * 4 },
          ],
          action: 'dialog',
          dialog: `It's the best Video Game console, the Sistendo Nwitch!\nI always wanted one of those!`,
        }),
        new EventTrigger({
          name: 'experiencesRoomSign',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 4 },
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 5 },
          ],
          action: 'dialog',
          dialog: `I'm not tired right now.\nAlso I probably shouldn't touch his bed.`,
        }),
        new EventTrigger({
          name: 'experiencesRoomSign',
          positions: [{ x: TRAINER_SPRITE_SIZE * 6, y: TRAINER_SPRITE_SIZE * 0 }],
          action: 'dialog',
          dialog: `It's bright outside.`,
        }),
      ],
      [
        {
          name: 'mainRoomGuide',
          spriteName: 'mainCharacter',
          x: TRAINER_SPRITE_SIZE * 5,
          y: TRAINER_SPRITE_SIZE * 2,
          direction: 'left',
          dialog: `Hey!\n I'm Sebastian\nThis is my room. You're free to walk around and explore. \n\nIf you're not sure of what to do... Check out the Trophy Room up there!`,
          movementPattern: [
            { direction: 'left', pauseMs: 3000 },
            { direction: 'down', pauseMs: 3000 },
            { direction: 'right', pauseMs: 3000 },
            { direction: 'up', pauseMs: 3000 },
          ],
          movementPatternDelay: 700,
        },
      ],
    );
  }
}
