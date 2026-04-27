import { Game } from './classes/game.js';
import { CANVAS_HEIGHT, CANVAS_SCALE, CANVAS_WIDTH } from './constants/game.js';
import { MainRoomMap } from './maps/mainRoom/index.js';
import { CHARACTER_SPRITES } from './classes/character.js';
import { sharedLoader } from './utils/assetLoader.js';

// Preload character sprites before any Character/Player/Npc is instantiated.
// This was previously a top-level await in character.js, which caused TDZ
// errors in Safari when async module graphs were evaluated out of order.
await Promise.all(
  Object.entries(CHARACTER_SPRITES).map(([key, src]) => sharedLoader.loadImage(key, src)),
);

export const startGameEngine = (canvas) => {
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
  // ctx.rotate(-90 * Math.PI / 180);

  ctx.imageSmoothingEnabled = false;

  const game = new Game(canvas.width, canvas.height, canvas, new MainRoomMap());
  game.animate(ctx, 0);
  return game;
};
