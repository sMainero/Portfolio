import { TRAINER_MOVEMENT_SPEED_MS, TRAINER_SPRITE_SIZE } from '../constants/player.js';
import { sharedLoader } from '../utils/assetLoader.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { TRAINER_MOVE_STEP, directionDeltas } from '../constants/movement.js';
import { TILE_SIZE } from '../constants/game.js';
import { TILE_SCALING_AMOUNT } from '../constants/tileset.js';

const DEBUG_SCALE = 4;

/**
 * Sprite atlas paths available for character instances.
 * @type {{ player: string, mainCharacter: string }}
 */
export const CHARACTER_SPRITES = {
  player: `${ASSETS_BASE}sprites/player.png`,
  mainCharacter: `${ASSETS_BASE}sprites/mainCharacter.png`,
};

/**
 * Tile-step movement deltas by direction.
 * @type {{
 *   up: { dx: number, dy: number, direction: 'up' },
 *   down: { dx: number, dy: number, direction: 'down' },
 *   left: { dx: number, dy: number, direction: 'left' },
 *   right: { dx: number, dy: number, direction: 'right' }
 * }}
 */
export const CHARACTER_MOVEMENT_STEPS = {
  up: { dx: 0, dy: -TRAINER_MOVE_STEP, direction: 'up' },
  down: { dx: 0, dy: TRAINER_MOVE_STEP, direction: 'down' },
  left: { dx: -TRAINER_MOVE_STEP, dy: 0, direction: 'left' },
  right: { dx: TRAINER_MOVE_STEP, dy: 0, direction: 'right' },
};

await Promise.all(
  Object.entries(CHARACTER_SPRITES).map(([key, src]) => sharedLoader.loadImage(key, src)),
);

/**
 * Base character entity with grid movement and sprite animation.
 */
export class Character {
  frames = {
    down: {
      neutral: { x: 0, y: 0 },
      walk: [
        { x: 0, y: 17 },
        { x: 0, y: 33 },
      ],
    },
    up: {
      neutral: { x: 16, y: 0 },
      walk: [
        { x: 16, y: 17 },
        { x: 16, y: 33 },
      ],
    },
    left: {
      neutral: { x: 32, y: 0 },
      walk: [
        { x: 32, y: 17 },
        { x: 32, y: 17 },
      ],
    },
    right: {
      neutral: { x: 48, y: 0 },
      walk: [
        { x: 48, y: 17 },
        { x: 48, y: 17 },
      ],
    },
  };

  /**
   * @param {import('./game.js').Game} game
   * @param {{
   *   spriteName?: keyof typeof CHARACTER_SPRITES,
   *   x?: number | null,
   *   y?: number | null,
   *   direction?: 'up' | 'down' | 'left' | 'right',
   *   enableMovement?: boolean,
   *   centerOnScreen?: boolean
   * }} [options]
   */
  constructor(
    game,
    {
      spriteName = 'player',
      x = null,
      y = null,
      direction = 'down',
      enableMovement = false,
      centerOnScreen = false,
    } = {},
  ) {
    if (!CHARACTER_SPRITES[spriteName]) {
      throw new Error(
        `Unknown character sprite "${spriteName}". Expected one of: ${Object.keys(CHARACTER_SPRITES).join(', ')}`,
      );
    }

    this.game = game;
    this.spriteName = spriteName;
    this.width = TRAINER_SPRITE_SIZE;
    this.height = TRAINER_SPRITE_SIZE;
    this.x = x ?? this.game.width - TILE_SIZE * TILE_SCALING_AMOUNT * 5;
    this.y = y ?? TRAINER_SPRITE_SIZE;
    this.sprite = this._trainerSprite();

    this.isMoving = false;
    this.moveStartX = this.x;
    this.moveStartY = this.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.moveElapsed = 0;
    this.moveDuration = TRAINER_MOVEMENT_SPEED_MS;
    this.direction = direction;
    this.footIndex = 0;
    this.currentFrame = this.frames[direction].neutral;
    this.enableMovement = enableMovement;
    this._centerOnScreen = centerOnScreen;
    this._updateFacing();
  }

  /**
   * Get the loaded sprite image for this character.
   * @returns {HTMLImageElement}
   */
  _trainerSprite() {
    return sharedLoader.get(this.spriteName);
  }

  /**
   * Update the tile position the character is currently facing.
   * @returns {void}
   */
  _updateFacing() {
    const { dx, dy } = directionDeltas[this.direction];
    this.facingX = this.x + dx;
    this.facingY = this.y + dy;
  }

  /**
   * Check whether this character currently occupies a tile.
   * @param {number} targetX
   * @param {number} targetY
   * @returns {boolean}
   */
  _occupiesTile(targetX, targetY) {
    const occupiedX = this.isMoving ? this.targetX : this.x;
    const occupiedY = this.isMoving ? this.targetY : this.y;

    return occupiedX === targetX && occupiedY === targetY;
  }

  /**
   * Check for collisions against player and NPCs at the given tile.
   * @param {number} targetX
   * @param {number} targetY
   * @returns {boolean}
   */
  _isCharacterCollisionAt(targetX, targetY) {
    const player = this.game.player;
    if (player && player !== this && player._occupiesTile(targetX, targetY)) {
      return true;
    }

    return this.game.map.npcs.some((npc) => npc !== this && npc._occupiesTile(targetX, targetY));
  }

  /**
   * Determine whether the character can move to the target tile.
   * @param {number} targetX
   * @param {number} targetY
   * @returns {boolean}
   */
  _canMoveTo(targetX, targetY) {
    return !(
      this.game.map.isSolid(targetX, targetY, this.width, this.height) ||
      this._isCharacterCollisionAt(targetX, targetY)
    );
  }

  /**
   * Begin a one-tile movement if possible.
   * @param {'up' | 'down' | 'left' | 'right'} direction
   * @param {{ playBlockedSfx?: boolean }} [options]
   * @returns {boolean}
   */
  _startMovement(direction, { playBlockedSfx = false } = {}) {
    const step = CHARACTER_MOVEMENT_STEPS[direction];
    if (!step || this.isMoving) return false;

    this.direction = step.direction;
    this.currentFrame = this.frames[step.direction].neutral;
    this._updateFacing();

    const targetX = Math.floor((this.x + step.dx) / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;
    const targetY = Math.floor((this.y + step.dy) / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;

    if (!this._canMoveTo(targetX, targetY)) {
      if (playBlockedSfx) {
        this.game.sfxPlayer.play('bump');
      }
      return false;
    }

    this.moveStartX = this.x;
    this.moveStartY = this.y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.moveElapsed = 0;
    this.isMoving = true;
    return true;
  }

  /**
   * Advance position interpolation for an active movement.
   * @param {number} deltaTime
   * @param {number} _fps
   * @returns {void}
   */
  _updatePosition(deltaTime, _fps) {
    this.moveElapsed += deltaTime;
    const progress = Math.min(this.moveElapsed / this.moveDuration, 1);

    this.x = this.moveStartX + (this.targetX - this.moveStartX) * progress;
    this.y = this.moveStartY + (this.targetY - this.moveStartY) * progress;

    this._updateFrame(progress);

    if (progress >= 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this._updateFacing();
      this.isMoving = false;

      if (this.direction === 'up' || this.direction === 'down') {
        this.footIndex = 1 - this.footIndex;
      }

      this._onMovementComplete();
    }
  }

  /**
   * Pick sprite animation frame for current movement progress.
   * @param {number} progress
   * @returns {void}
   */
  _updateFrame(progress) {
    const frameSet = this.frames[this.direction];
    if (progress < 0.25 || progress >= 0.75) {
      this.currentFrame = frameSet.neutral;
    } else {
      this.currentFrame = frameSet.walk[this.footIndex];
    }
  }

  /**
   * Internal movement update tick.
   * @param {number} deltaTime
   * @param {number} fps
   * @returns {boolean}
   */
  _update(deltaTime, fps) {
    if (!this.isMoving) return false;
    this._updatePosition(deltaTime, fps);
    return this.isMoving;
  }

  /**
   * Hook called once a movement step finishes.
   * @returns {void}
   */
  _onMovementComplete() {}

  /**
   * Public per-frame character update.
   * @param {string[]} _input
   * @param {number} deltaTime
   * @param {number} fps
   * @returns {void}
   */
  update(_input, deltaTime, fps) {
    this._update(deltaTime, fps);
  }

  /**
   * Draw the character sprite to the screen.
   * @param {CanvasRenderingContext2D} context
   * @returns {void}
   */
  draw(context) {
    const screenX = this._centerOnScreen
      ? this.game.width / 2 - this.width / 2
      : this.x - this.game.cameraX;
    const screenY = this._centerOnScreen
      ? this.game.height / 2 - this.height / 2
      : this.y - this.game.cameraY;

    context.drawImage(
      this.sprite,
      this.currentFrame.x * DEBUG_SCALE,
      this.currentFrame.y * DEBUG_SCALE,
      this.width,
      this.height,
      screenX,
      screenY,
      this.width,
      this.height,
    );
  }
}
