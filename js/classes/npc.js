import { Dialog } from './dialog.js';
import { Character } from './character.js';

/**
 * Non-player character with optional movement pattern behavior.
 */
export class Npc extends Character {
  /**
   * @param {import('./game.js').Game} game
   * @param {{
   *   name?: string,
   *   spriteName?: 'player' | 'mainCharacter',
   *   x?: number | null,
   *   y?: number | null,
   *   direction?: 'up' | 'down' | 'left' | 'right',
   *   dialog?: string,
   *   movementPattern?: Array<string | { direction: 'up' | 'down' | 'left' | 'right', pauseMs?: number } | { waitMs: number }>,
   *   movementPatternDelay?: number,
   *   blockedMoveDelay?: number
   * }} [options]
   */
  constructor(
    game,
    {
      name = 'npc',
      spriteName = 'mainCharacter',
      x = null,
      y = null,
      direction = 'down',
      dialog = '',
      movementPattern = [],
      movementPatternDelay = 350,
      blockedMoveDelay = 250,
    } = {},
  ) {
    super(game, {
      spriteName,
      x,
      y,
      direction,
      enableMovement: false,
      centerOnScreen: false,
    });

    this.name = name;
    this.dialog = new Dialog(dialog);
    this.movementPattern = movementPattern;
    this.movementPatternDelay = movementPatternDelay;
    this.blockedMoveDelay = blockedMoveDelay;
    this._movementPatternIndex = 0;
    this._movementPatternElapsed = 0;
  }

  /**
   * Check whether player is currently facing this NPC.
   * @param {import('./player.js').Player} player
   * @returns {boolean}
   */
  isFacing(player) {
    return player.facingX === this.x && player.facingY === this.y;
  }

  /**
   * Rotate NPC idle facing direction toward a target point.
   * @param {number} targetX
   * @param {number} targetY
   * @returns {void}
   */
  _faceToward(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      this.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.direction = dy > 0 ? 'down' : 'up';
    }

    this.currentFrame = this.frames[this.direction].neutral;
    this._updateFacing();
  }

  /**
   * Advance movement pattern cursor and return current step.
   * @returns {string | { direction: 'up' | 'down' | 'left' | 'right', pauseMs?: number } | { waitMs: number } | null}
   */
  _advanceMovementPattern() {
    if (!this.movementPattern.length) return null;

    const step = this.movementPattern[this._movementPatternIndex];
    this._movementPatternIndex = (this._movementPatternIndex + 1) % this.movementPattern.length;
    return step;
  }

  /**
   * Update movement pattern timers and execute the next movement step.
   * @param {number} deltaTime
   * @returns {void}
   */
  _runMovementPattern(deltaTime) {
    if (!this.movementPattern.length || this.isMoving) return;

    this._movementPatternElapsed += deltaTime;

    if (this._movementPatternElapsed < this.movementPatternDelay) return;

    const step = this._advanceMovementPattern();
    if (!step) return;

    if (typeof step === 'string') {
      const started = this._startMovement(step);
      this._movementPatternElapsed = 0;
      this.movementPatternDelay = started ? this.moveDuration : this.blockedMoveDelay;
      return;
    }

    if (typeof step.waitMs === 'number') {
      this._movementPatternElapsed = 0;
      this.movementPatternDelay = step.waitMs;
      return;
    }

    const started = this._startMovement(step.direction);
    const pauseMs = step.pauseMs ?? 350;
    this._movementPatternElapsed = 0;
    this.movementPatternDelay = started ? this.moveDuration + pauseMs : this.blockedMoveDelay;
  }

  /**
   * NPC per-frame update, including interaction lock and autonomous movement.
   * @param {string[]} _input
   * @param {number} deltaTime
   * @param {number} fps
   * @returns {void}
   */
  update(_input, deltaTime, fps) {
    const isInteracting = this.game.state.activeEvent === this;
    if (isInteracting) {
      this._faceToward(this.game.player.x, this.game.player.y);
      // Don't run movement pattern while talking
      this._update(deltaTime, fps);
    } else {
      this._update(deltaTime, fps);
      this._runMovementPattern(deltaTime);
    }
  }
}
