import {
  TRAINER_MOVEMENT_SPEED_MS,
  TRAINER_SPRITE_SIZE,
} from '../constants/player.js';
import { sharedLoader } from '../utils/assetLoader.js';
import { SfxPlayer } from './sounds/sfxPlayer.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { TRAINER_MOVE_STEP, directionDeltas } from '../constants/movement.js';
import { STATE_BACKUP_THRESHOLD } from '../constants/state.js';

const directions = {
  ArrowUp: { dx: 0, dy: -TRAINER_MOVE_STEP, dir: 'up' },
  ArrowDown: { dx: 0, dy: TRAINER_MOVE_STEP, dir: 'down' },
  ArrowLeft: { dx: -TRAINER_MOVE_STEP, dy: 0, dir: 'left' },
  ArrowRight: { dx: TRAINER_MOVE_STEP, dy: 0, dir: 'right' },
};

await sharedLoader.loadImage(
  'trainer',
  `${ASSETS_BASE}sprites/pokemon_gen_1_trainer_sprite_long_hair_final.png`,
);

const debugScale = 4;
export class Player {
  constructor(
    game,
    enableMovement = false,
    x = null,
    y = null,
    direction = 'down',
  ) {
    this.game = game;
    this.width = TRAINER_SPRITE_SIZE;
    this.height = TRAINER_SPRITE_SIZE;
    // World-space starting position (tile-aligned)
    this.x = x ? x : this.game.width - TRAINER_SPRITE_SIZE * 2;
    this.y = y ? y : TRAINER_SPRITE_SIZE;
    this.sprite = this._trainerSprite();

    // Tile-based movement properties
    this.isMoving = false;
    this.moveStartX = this.x;
    this.moveStartY = this.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.moveStartTime = 0;
    this.moveDuration = TRAINER_MOVEMENT_SPEED_MS;
    this.direction = direction; // current facing direction
    this.footIndex = 0; // alternates 0/1 for walk cycle
    this.currentFrame = this.frames[direction].neutral;
    this.sfxPlayer = new SfxPlayer();
    this.enableMovement = enableMovement;
    this._updateFacing();
  }

  _trainerSprite() {
    return sharedLoader.get('trainer');
  }

  _updateFacing() {
    const { dx, dy } = directionDeltas[this.direction];
    this.facingX = this.x + dx;
    this.facingY = this.y + dy;
  }

  _startMovement(input) {
    const key = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].find((k) =>
      input.includes(k),
    );
    if (!key) return;

    const { dx, dy, dir } = directions[key];
    this.direction = dir;
    this.currentFrame = this.frames[dir].neutral; // face direction immediately
    this._updateFacing();

    // Snap to tile grid (guards against floating point drift)
    let newTargetX =
      Math.floor((this.x + dx) / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;
    let newTargetY =
      Math.floor((this.y + dy) / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;

    // Tile-based collision — out-of-bounds tiles are treated as solid
    if (
      this.game.map.isSolid(newTargetX, newTargetY, this.width, this.height)
    ) {
      this.sfxPlayer.play('bump');
      return;
    }

    this.moveStartX = this.x;
    this.moveStartY = this.y;
    this.targetX = newTargetX;
    this.targetY = newTargetY;
    this.moveStartTime = Date.now();
    this.isMoving = true;
  }

  _updatePosition(deltaTime, fps) {
    const elapsed = Date.now() - this.moveStartTime;
    const progress = Math.min(elapsed / this.moveDuration, 1);

    this.x = this.moveStartX + (this.targetX - this.moveStartX) * progress;
    this.y = this.moveStartY + (this.targetY - this.moveStartY) * progress;

    this.updateFrame(progress);

    if (progress >= 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this._updateFacing();

      this.game.map?.portal.detectMove(this, this.game);
      this.isMoving = false;

      if (this.game.state.stepsSinceBackup >= STATE_BACKUP_THRESHOLD) {
        this.game.state.saveStateBackup({
          player: this,
          mapKey: this.game.map.currentMapKey,
        });
      } else {
        this.game.state.stepsSinceBackup++;
      }
      // Only alternate foot for directions that have two walk frames
      if (this.direction === 'up' || this.direction === 'down') {
        this.footIndex = 1 - this.footIndex;
      }
    }
  }

  updateFrame(progress) {
    const frameSet = this.frames[this.direction];
    if (progress < 0.25 || progress >= 0.75) {
      this.currentFrame = frameSet.neutral;
    } else {
      this.currentFrame = frameSet.walk[this.footIndex];
    }
  }

  update(input, deltaTime, fps) {
    if (this.isMoving) {
      this._updatePosition(deltaTime, fps);
      if (this.isMoving || !this.enableMovement) return; // still mid-step, wait
      // movement just finished — check if a portal disabled movement inside _updatePosition
      // otherwise fall through to check input immediately
    }

    if (input.length === 0) return;
    this._startMovement(input);
  }

  draw(context) {
    // Always draw at the center of the canvas — the camera moves, not the player
    const screenX = this.game.width / 2 - this.width / 2;
    const screenY = this.game.height / 2 - this.height / 2;
    context.drawImage(
      this.sprite,
      this.currentFrame.x * debugScale,
      this.currentFrame.y * debugScale,
      this.width,
      this.height,
      screenX,
      screenY,
      this.width,
      this.height,
    );
  }
  // Frames keyed by direction — neutral + walk cycle per direction
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
}
