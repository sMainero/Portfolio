import { TRAINER_MOVEMENT_SPEED_MS, TRAINER_SPRITE_SIZE } from '../constants/player.js';
import { STATE_BACKUP_THRESHOLD } from '../constants/state.js';
import { Character } from './character.js';

const INPUT_TO_DIRECTION = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/**
 * Player-controlled character with keyboard-driven movement.
 */
export class Player extends Character {
  /**
   * @param {import('./game.js').Game} game
   * @param {boolean} [enableMovement=false]
   * @param {number | null} [x=null]
   * @param {number | null} [y=null]
   * @param {'up' | 'down' | 'left' | 'right'} [direction='down']
   */
  constructor(game, enableMovement = false, x = null, y = null, direction = 'down') {
    super(game, {
      spriteName: 'player',
      x,
      y,
      direction,
      enableMovement,
      centerOnScreen: true,
    });

    this.width = TRAINER_SPRITE_SIZE;
    this.height = TRAINER_SPRITE_SIZE;
    this.moveDuration = TRAINER_MOVEMENT_SPEED_MS;
  }

  /**
   * Start movement from currently pressed directional keys.
   * @param {string[]} input
   * @returns {void}
   */
  _startMovement(input) {
    const key = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].find((k) => input.includes(k));
    if (!key) return;

    this._startMovementByDirection(INPUT_TO_DIRECTION[key]);
  }

  /**
   * Start movement in a specific direction.
   * @param {'up' | 'down' | 'left' | 'right'} direction
   * @returns {void}
   */
  _startMovementByDirection(direction) {
    super._startMovement(direction, { playBlockedSfx: true });
  }

  /**
   * Handle post-step events (portal check and periodic state backup).
   * @returns {void}
   */
  _onMovementComplete() {
    this.game.map?.portal.detectMove(this, this.game);

    if (this.game.state.stepsSinceBackup >= STATE_BACKUP_THRESHOLD) {
      this.game.state.saveStateBackup({
        player: this,
        mapKey: this.game.map.currentMapKey,
      });
    } else {
      this.game.state.stepsSinceBackup++;
    }
  }

  /**
   * Player per-frame update and movement handling.
   * @param {string[]} input
   * @param {number} deltaTime
   * @param {number} fps
   * @returns {void}
   */
  update(input, deltaTime, fps) {
    if (this.isMoving) {
      this._update(deltaTime, fps);
      if (this.isMoving || !this.enableMovement) return; // still mid-step, wait
      // movement just finished — check if a portal disabled movement inside _updatePosition
      // otherwise fall through to check input immediately
    }

    if (input.length === 0) return;
    this._startMovement(input);
  }
}
