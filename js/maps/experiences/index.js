/**
 * @import { TileMap } from '../../classes/tileMap.js';
 */
import { EventTrigger } from '../../classes/eventTrigger.js';
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
      [
        new EventTrigger({
          name: 'ordeno',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 1 },
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 2 },
          ],
          action: 'dialog',
          dialog:
            '"POS Architect"\n\nEarned at Ordeno — built a full restaurant POS system using Angular, React, Flutter, AWS & MongoDB',
        }),
        new EventTrigger({
          name: '8base',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 3 },
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 4 },
          ],
          action: 'dialog',
          dialog:
            '"GraphQL Craftsman"\n\nEarned at 8base — shipped fast apps with React and GraphQL APIs',
        }),
        new EventTrigger({
          name: 'gap',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 5 },
            { x: TRAINER_SPRITE_SIZE * 0, y: TRAINER_SPRITE_SIZE * 6 },
          ],
          action: 'dialog',
          dialog:
            '"Builder"\n\nEarned at Growth Acceleration Partners — scaled backend & frontend systems using React and Node.js',
        }),
        new EventTrigger({
          name: 'soho',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 1 },
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 2 },
          ],
          action: 'dialog',
          dialog:
            '"Fintech Leader"\n\nEarned at Soho — led development of a credit card platform using React, NestJS & GCP',
        }),
        new EventTrigger({
          name: 'cotecmar',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 3 },
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 4 },
          ],
          action: 'dialog',
          dialog:
            '"Mission Control Dev"\n\nEarned at COTECMAR — built real-time tracking systems with React, Node & Socket.IO',
        }),
        new EventTrigger({
          name: 'getitout',
          positions: [
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 5 },
            { x: TRAINER_SPRITE_SIZE * 2, y: TRAINER_SPRITE_SIZE * 6 },
          ],
          action: 'dialog',
          dialog:
            '"AI Copy Wizard"\n\nEarned at GETitOUT — built AI-powered marketing tools using Svelte & Firebase',
        }),
      ],
    );
  }
}
