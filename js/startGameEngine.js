import { Game } from './classes/game.js';
import { CANVAS_HEIGHT, CANVAS_SCALE, CANVAS_WIDTH } from './constants/game.js';
import { MainRoomMap } from './maps/mainRoom/index.js';
import { preloadGameAssets } from './utils/assetPreloader.js';

// Load all game assets (tilesets, sprites, dialog border) in one place before
// any game class is instantiated. startGameEngine.js is a dynamic import so
// this top-level await is isolated and safe across all browsers.
await preloadGameAssets();

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
