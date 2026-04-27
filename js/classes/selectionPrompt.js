import {
  DIALOG_BORDER_TILE_SIZE,
  DIALOG_BORDER_SCALE,
  DIALOG_FONT,
  DIALOG_LINE_HEIGHT,
  DIALOG_LINES_PER_PAGE,
  DIALOG_MARGIN,
  DIALOG_PADDING,
} from '../constants/dialog.js';
import { sharedLoader } from '../utils/assetLoader.js';
import { Toast } from '../3d/components/tutorial/Toast.js';

const TILE = DIALOG_BORDER_TILE_SIZE * DIALOG_BORDER_SCALE;
const BOX_W = 200; // same width as Menu for consistency
const TEXT_PADDING = 8;
const CURSOR = '\u25ba'; // ►
const CURSOR_OFFSET = 16;
const MAX_LABEL_LENGTH = 6;

/**
 * @typedef {{ type: 'useLink', url: string }} UseLinkAction
 * @typedef {{ type: 'copyEmail', email: string }} CopyEmailAction
 * @typedef {{ type: 'usePortal', targetMap: string, targetX: number, targetY: number }} UsePortalAction
 * @typedef {UseLinkAction | CopyEmailAction | UsePortalAction} SelectionAction
 * @typedef {{ label: string, action?: SelectionAction }} SelectionOption
 */

/**
 * SelectionPrompt — multi-option popup drawn above the dialog box.
 */
export class SelectionPrompt {
  /** @type {SelectionOption[]} */
  _options;
  /** @type {boolean} */
  isOpen = false;
  /** @type {number} */
  _cursor = 0;
  /**
   * Prevents re-opening the prompt after the player has already answered.
   * Reset when the EventTrigger is re-activated.
   * @type {boolean}
   */
  _answered = false;

  /** @param {SelectionOption[]} options */
  constructor(options) {
    this._options = (options ?? []).map((option) => ({
      ...option,
      label: String(option.label ?? '')
        .trim()
        .slice(0, MAX_LABEL_LENGTH),
    }));
  }

  /**
   * Reset the prompt state to its initial closed state.
   * @returns {void}
   */
  reset() {
    this.isOpen = false;
    this._cursor = 0;
    this._answered = false;
  }

  /**
   * Open the prompt and reset cursor to the first option.
   * @returns {void}
   */
  open() {
    if (!this._options.length) return;
    this.isOpen = true;
    this._cursor = 0;
  }

  /** @param {import('./game.js').Game} game */
  update(game) {
    if (!this.isOpen) return;

    const sfx = game.sfxPlayer;

    if (game.input.keys.includes('ArrowUp')) {
      game.input.consumeKey('ArrowUp');
      sfx.play('menuMove');
      this._cursor = (this._cursor - 1 + this._options.length) % this._options.length;
    }

    if (game.input.keys.includes('ArrowDown')) {
      game.input.consumeKey('ArrowDown');
      sfx.play('menuMove');
      this._cursor = (this._cursor + 1) % this._options.length;
    }

    if (game.input.keys.includes('Enter')) {
      game.input.consumeKey('Enter');
      sfx.play('confirm');
      this._select(game);
    }

    if (game.input.keys.includes('Escape') || game.input.keys.includes('B')) {
      game.input.consumeKey('Escape');
      game.input.consumeKey('B');
      sfx.play('cancel');
      this._answered = true;
      this.isOpen = false;
      game.state.activeEvent.dialog.close(game);
    }
  }

  /** @param {import('./game.js').Game} game */
  _select(game) {
    this._answered = true;
    this.isOpen = false;

    const selected = this._options[this._cursor];
    // Close dialog first (won't re-open prompt because _answered is true)
    game.state.activeEvent.dialog.close(game);

    if (!selected?.action) return;

    if (selected.action.type === 'useLink') {
      const { url } = selected.action;
      window.open(url, '_blank', 'noopener,noreferrer');

      // Fallback for browsers (e.g. mobile Safari) that silently block the
      // window.open call. After 500 ms, if the page is still visible the tab
      // switch / app open didn't happen — show a tappable toast so the user
      // can retry from a fresh trusted click.
      setTimeout(() => {
        if (document.visibilityState !== 'visible') return;
        Toast.getInstance().show({
          text: 'Hmm\u2026 the link didn\u2019t open. Press here to try again.',
          position: 'top',
          autoHideMs: 5000,
          onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
        });
      }, 500);

      return;
    }

    if (selected.action.type === 'copyEmail') {
      const { email } = selected.action;
      // Show a tappable toast — the tap is a real trusted click, so clipboard
      // access is always permitted regardless of how the prompt was confirmed.
      Toast.getInstance().show({
        text: 'Email ready. Press here to copy.',
        position: 'top',
        autoHideMs: 5000,
        onClick: () => window.copyEmailToClipboard?.(email),
      });
      return;
    }

    if (selected.action.type === 'usePortal') {
      game.startMapTransition(
        selected.action.targetMap,
        selected.action.targetX,
        selected.action.targetY,
      );
    }
  }

  /**
   * Test whether a canvas-space click lands on one of the option rows.
   * If it does, move the cursor to that option and trigger _select().
   * Returns true if the click was handled.
   * @param {number} canvasX
   * @param {number} canvasY
   * @param {import('./game.js').Game} game
   * @returns {boolean}
   */
  clickAt(canvasX, canvasY, game) {
    if (!this.isOpen) return false;

    const BOX_H = TILE * 2 + TEXT_PADDING * 2 + this._options.length * DIALOG_LINE_HEIGHT;
    const dialogBoxH = DIALOG_PADDING * 2 + DIALOG_LINES_PER_PAGE * DIALOG_LINE_HEIGHT;
    const dialogBoxY = game.height - dialogBoxH - DIALOG_MARGIN;
    const BOX_X = game.width - BOX_W - DIALOG_MARGIN;
    const BOX_Y = dialogBoxY - BOX_H - 4;

    // Quick bounds check for the whole box.
    if (canvasX < BOX_X || canvasX > BOX_X + BOX_W || canvasY < BOX_Y || canvasY > BOX_Y + BOX_H) {
      return false;
    }

    const rowsTop = BOX_Y + TILE + TEXT_PADDING;
    const relY = canvasY - rowsTop;
    if (relY < 0) return false;

    const index = Math.floor(relY / DIALOG_LINE_HEIGHT);
    if (index < 0 || index >= this._options.length) return false;

    this._cursor = index;
    game.sfxPlayer.play('confirm');
    this._select(game);
    return true;
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {import('./game.js').Game} game
   */
  draw(context, game) {
    if (!this.isOpen) return;

    const BOX_H = TILE * 2 + TEXT_PADDING * 2 + this._options.length * DIALOG_LINE_HEIGHT;

    // Mirror dialog box position so we can sit just above it.
    const dialogBoxH = DIALOG_PADDING * 2 + DIALOG_LINES_PER_PAGE * DIALOG_LINE_HEIGHT;
    const dialogBoxY = game.height - dialogBoxH - DIALOG_MARGIN;

    const BOX_X = game.width - BOX_W - DIALOG_MARGIN;
    const BOX_Y = dialogBoxY - BOX_H - 4;

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

    for (let i = 0; i < this._options.length; i++) {
      const x = BOX_X + TILE + TEXT_PADDING;
      const y = BOX_Y + TILE + TEXT_PADDING + i * DIALOG_LINE_HEIGHT;
      if (i === this._cursor) {
        context.fillText(CURSOR, x, y);
      }
      context.fillText(this._options[i].label, x + CURSOR_OFFSET, y);
    }

    context.restore();
  }
}
