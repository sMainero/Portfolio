import { Dialog } from './dialog.js';
import { SelectionPrompt } from './selectionPrompt.js';

/**
 * Trigger entity activated when the player is facing or stepping on configured positions.
 */
export class EventTrigger {
  /**
   * @param {object} options
   * @param {string} options.name - unique identifier within the map
   * @param {{ x: number, y: number }[]} options.positions - world-space positions that activate this trigger
   * @param {'dialog' | 'selection'} options.action
   * @param {string} [options.dialog] - dialog text shown before the prompt
   * @param {import('./selectionPrompt.js').SelectionOption[]} [options.selectionOptions]
   */
  constructor({ name, positions, action, dialog = '', selectionOptions = [] }) {
    this.name = name;
    this.action = action;
    this.dialog = new Dialog(dialog);
    this.selectionPrompt = selectionOptions.length ? new SelectionPrompt(selectionOptions) : null;
    this._triggers = {};
    positions.forEach(({ x, y }) => {
      this._triggers[`${x},${y}`] = true;
    });
  }

  /**
   * Returns true if the player is facing one of this trigger's positions.
   * @param {import('./player.js').Player} player
   * @returns {boolean}
   */
  isFacing(player) {
    return !!this._triggers[`${player.facingX},${player.facingY}`];
  }

  /**
   * Returns true if this trigger occupies the given world position.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  hasPosition(x, y) {
    return !!this._triggers[`${x},${y}`];
  }
}
