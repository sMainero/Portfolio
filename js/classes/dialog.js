import {
  DIALOG_BORDER_TILE_SIZE,
  DIALOG_CHARS_PER_FRAME,
  DIALOG_CHARACTER_WIDTH,
  DIALOG_FONT,
  DIALOG_LINE_HEIGHT,
  DIALOG_LINES_PER_PAGE,
  DIALOG_MARGIN,
  DIALOG_PADDING,
  DIALOG_BORDER_SCALE,
} from '../constants/dialog.js';
import { CANVAS_WIDTH } from '../constants/game.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { sharedLoader } from '../utils/assetLoader.js';

const MAX_CHARS_PER_LINE = Math.floor(
  (CANVAS_WIDTH - DIALOG_MARGIN * 2 - DIALOG_PADDING * 2) /
    DIALOG_CHARACTER_WIDTH,
);

await sharedLoader.loadImage(
  'dialogBorder',
  `${ASSETS_BASE}borders/BorderTileSet.png`,
);

export class Dialog {
  /**
   * @param {string} text
   */
  constructor(text) {
    // Collapse horizontal whitespace only — preserve explicit \n line breaks
    this._text = text.replace(/[^\S\n]+/g, ' ').trim();
    this._wrappedLines = this._wrapLines();
    this.lineOffset = 0;
    this.charIndex = 0;
  }

  reset() {
    // this._wrappedLines = this._wrapLines();
    this.lineOffset = 0;
    this.charIndex = 0;
  }

  _wrapLines() {
    const lines = [];
    for (const segment of this._text.split('\n')) {
      if (!segment.trim()) {
        lines.push('');
        continue;
      }
      const words = segment.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (test.length > MAX_CHARS_PER_LINE) {
          if (current) lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  _visibleLines() {
    return this._wrappedLines.slice(
      this.lineOffset,
      this.lineOffset + DIALOG_LINES_PER_PAGE,
    );
  }

  /** @param {import('./game.js').Game} game */
  update(game) {
    const visibleLines = this._visibleLines();
    const totalChars = visibleLines.reduce((sum, l) => sum + l.length, 0);

    if (this.charIndex < totalChars) {
      this.charIndex = Math.min(
        this.charIndex + DIALOG_CHARS_PER_FRAME,
        totalChars,
      );
    }

    if (game.input.keys.includes('Enter')) {
      game.input.consumeKey('Enter');
      if (this.charIndex < totalChars) {
        // Skip typewriter to end of current window
        this.charIndex = totalChars;
      } else {
        const nextOffset = this.lineOffset + DIALOG_LINES_PER_PAGE;
        if (nextOffset < this._wrappedLines.length) {
          this.lineOffset = nextOffset;
          this.charIndex = 0;
        } else {
          this.close(game);
        }
      }
    }
  }

  /** @param {import('./game.js').Game} game */
  close(game) {
    const event = game.state.activeEvent;
    game.state.saveStateBackup({
      interactions: {
        [game.map.currentMapKey]: {
          [event.name]: { interacted: true },
        },
      },
    });
    this.reset();
    game.player.enableMovement = true;
    game.state.activeEvent = null;
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {import('./game.js').Game} game
   */
  draw(context, game) {
    const BOX_W = game.width - DIALOG_MARGIN * 2;

    context.save();
    context.font = DIALOG_FONT;
    context.textBaseline = 'top';

    const visibleLines = this._visibleLines();
    const totalChars = visibleLines.reduce((sum, l) => sum + l.length, 0);

    const BOX_H =
      DIALOG_PADDING * 2 + DIALOG_LINES_PER_PAGE * DIALOG_LINE_HEIGHT;
    const BOX_X = DIALOG_MARGIN;
    const BOX_Y = game.height - BOX_H - DIALOG_MARGIN;

    const TILE = DIALOG_BORDER_TILE_SIZE * DIALOG_BORDER_SCALE;
    const border = sharedLoader.get('dialogBorder');
    const innerX = BOX_X + TILE;
    const innerY = BOX_Y + TILE;
    const innerW = BOX_W - TILE * 2;
    const innerH = BOX_H - TILE * 2;

    context.imageSmoothingEnabled = false;
    // fill
    context.drawImage(border, 8, 8, 8, 8, innerX, innerY, innerW, innerH);
    // edges
    context.drawImage(border, 8, 0, 8, 8, innerX, BOX_Y, innerW, TILE); // top
    context.drawImage(
      border,
      8,
      16,
      8,
      8,
      innerX,
      BOX_Y + BOX_H - TILE,
      innerW,
      TILE,
    ); // bottom
    context.drawImage(border, 0, 8, 8, 8, BOX_X, innerY, TILE, innerH); // left
    context.drawImage(
      border,
      16,
      8,
      8,
      8,
      BOX_X + BOX_W - TILE,
      innerY,
      TILE,
      innerH,
    ); // right
    // corners
    context.drawImage(border, 0, 0, 8, 8, BOX_X, BOX_Y, TILE, TILE); // TL
    context.drawImage(
      border,
      16,
      0,
      8,
      8,
      BOX_X + BOX_W - TILE,
      BOX_Y,
      TILE,
      TILE,
    ); // TR
    context.drawImage(
      border,
      0,
      16,
      8,
      8,
      BOX_X,
      BOX_Y + BOX_H - TILE,
      TILE,
      TILE,
    ); // BL
    context.drawImage(
      border,
      16,
      16,
      8,
      8,
      BOX_X + BOX_W - TILE,
      BOX_Y + BOX_H - TILE,
      TILE,
      TILE,
    ); // BR

    context.fillStyle = 'black';

    let charsLeft = this.charIndex;
    for (let i = 0; i < visibleLines.length; i++) {
      if (charsLeft <= 0) break;
      const visible = visibleLines[i].slice(0, charsLeft);
      charsLeft -= visibleLines[i].length;
      context.fillText(
        visible,
        BOX_X + DIALOG_PADDING,
        BOX_Y + DIALOG_PADDING + i * DIALOG_LINE_HEIGHT + 8, // +8 to better center vertically within the border
      );
    }

    // Advance/close indicator when current window is fully shown
    if (this.charIndex >= totalChars) {
      context.fillText(
        '\u25bc',
        BOX_X + BOX_W - DIALOG_PADDING - 8,
        BOX_Y + BOX_H - DIALOG_PADDING - DIALOG_LINE_HEIGHT,
      );
    }

    context.restore();
  }
}
