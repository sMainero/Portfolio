import {
  DIALOG_BORDER_TILE_SIZE,
  DIALOG_BORDER_SCALE,
  DIALOG_FONT,
  DIALOG_LINE_HEIGHT,
  DIALOG_MARGIN,
} from '../constants/dialog.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/game.js';
import { sharedLoader } from '../utils/assetLoader.js';

const TILE = DIALOG_BORDER_TILE_SIZE * DIALOG_BORDER_SCALE;
const MENU_WIDTH = 200;
const MENU_TEXT_PADDING = 8;
const CURSOR_OFFSET = 16;
const CURSOR = '\u25ba'; // ►

/**
 * @typedef {{ label: string, action: (game: import('./game.js').Game) => void }} MenuItem
 */

export class Menu {
  /** @type {MenuItem[]} */
  _items = [];
  _cursor = 0;
  isOpen = false;

  /**
   * @param {MenuItem[]} items
   */
  constructor(items) {
    this._items = items;
  }

  open() {
    this._cursor = 0;
    this.isOpen = true;
  }

  /** @param {import('./game.js').Game} game */
  close(game) {
    this.isOpen = false;
    game.input.consumeKey('p');
    game.input.consumeKey('Escape');
    game.input.consumeKey('Start');
    game.input.consumeKey('B');
  }

  /** @param {import('./game.js').Game} game */
  update(game) {
    if (!this.isOpen) return;

    // Dialog has priority — hands off when a dialog is active
    if (game.state.activeEvent) return;

    const sfx = game.sfxPlayer;

    if (game.input.keys.includes('ArrowUp')) {
      game.input.consumeKey('ArrowUp');
      sfx.play('menuMove');
      this._cursor = (this._cursor - 1 + this._items.length) % this._items.length;
    }

    if (game.input.keys.includes('ArrowDown')) {
      game.input.consumeKey('ArrowDown');
      sfx.play('menuMove');
      this._cursor = (this._cursor + 1) % this._items.length;
    }

    if (game.input.keys.includes('Enter')) {
      game.input.consumeKey('Enter');
      sfx.play('confirm');
      this._items[this._cursor].action(game);
    }
    if (game.input.keys.includes('Escape')) {
      game.input.consumeKey('Escape');
      sfx.play('cancel');
      this.close(game);
    }

    // p or Start closes the menu
    if (game.input.keys.includes('p') || game.input.keys.includes('Start')) {
      sfx.play('cancel');
      this.close(game);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {import('./game.js').Game} game
   */
  draw(context, game) {
    if (!this.isOpen) return;

    const BOX_W = MENU_WIDTH;
    const BOX_Y = DIALOG_MARGIN;
    const BOX_H = CANVAS_HEIGHT - BOX_Y - DIALOG_MARGIN;
    const BOX_X = CANVAS_WIDTH - BOX_W - DIALOG_MARGIN;

    const border = sharedLoader.get('dialogBorder');
    const innerX = BOX_X + TILE;
    const innerY = BOX_Y + TILE;
    const innerW = BOX_W - TILE * 2;
    const innerH = BOX_H - TILE * 2;

    context.save();
    context.imageSmoothingEnabled = false;
    context.font = DIALOG_FONT;
    context.textBaseline = 'top';
    context.fillStyle = 'black';

    // fill
    context.drawImage(border, 8, 8, 8, 8, innerX, innerY, innerW, innerH);
    // edges
    context.drawImage(border, 8, 0, 8, 8, innerX, BOX_Y, innerW, TILE); // top
    context.drawImage(border, 8, 16, 8, 8, innerX, BOX_Y + BOX_H - TILE, innerW, TILE); // bottom
    context.drawImage(border, 0, 8, 8, 8, BOX_X, innerY, TILE, innerH); // left
    context.drawImage(border, 16, 8, 8, 8, BOX_X + BOX_W - TILE, innerY, TILE, innerH); // right
    // corners
    context.drawImage(border, 0, 0, 8, 8, BOX_X, BOX_Y, TILE, TILE); // TL
    context.drawImage(border, 16, 0, 8, 8, BOX_X + BOX_W - TILE, BOX_Y, TILE, TILE); // TR
    context.drawImage(border, 0, 16, 8, 8, BOX_X, BOX_Y + BOX_H - TILE, TILE, TILE); // BL
    context.drawImage(border, 16, 16, 8, 8, BOX_X + BOX_W - TILE, BOX_Y + BOX_H - TILE, TILE, TILE); // BR

    // Items
    for (let i = 0; i < this._items.length; i++) {
      const x = BOX_X + TILE + MENU_TEXT_PADDING;
      const y = BOX_Y + TILE + MENU_TEXT_PADDING + i * DIALOG_LINE_HEIGHT;
      if (i === this._cursor) {
        context.fillText(CURSOR, x, y);
      }
      context.fillText(this._items[i].label, x + CURSOR_OFFSET, y);
    }

    context.restore();
  }
}
