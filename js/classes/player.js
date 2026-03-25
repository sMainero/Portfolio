import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game.js';
import {
  TRAINER_MOVE_STEP,
  TRAINER_MOVEMENT_SPEED_MS,
  TRAINER_SPRITE_SIZE,
} from '../constants/player.js';
import { AssetLoader } from '../utils/assetLoader.js';
import { SfxPlayer } from './sounds/sfxPlayer.js';
import { ASSETS_BASE } from '../constants/assets.js';

const MAX_TARGET_X = CANVAS_WIDTH - TRAINER_SPRITE_SIZE;

const MAX_TARGET_Y = CANVAS_HEIGHT - TRAINER_SPRITE_SIZE;

const directions = {
  ArrowUp: { dx: 0, dy: -TRAINER_MOVE_STEP, dir: 'up' },
  ArrowDown: { dx: 0, dy: TRAINER_MOVE_STEP, dir: 'down' },
  ArrowLeft: { dx: -TRAINER_MOVE_STEP, dy: 0, dir: 'left' },
  ArrowRight: { dx: TRAINER_MOVE_STEP, dy: 0, dir: 'right' },
};

const loader = new AssetLoader();
await loader.loadImage(
  'trainer',
  `${ASSETS_BASE}sprites/pokemon_gen_1_trainer_sprite.png`,
);

const debugScale = 4;
export class Player {
  constructor(game) {
    this.game = game;
    this.width = TRAINER_SPRITE_SIZE;
    this.height = TRAINER_SPRITE_SIZE;
    // Start at tile-aligned position (multiple of TRAINER_MOVE_STEP)
    this.x = this.game.width - TRAINER_SPRITE_SIZE * 2;
    this.y = TRAINER_SPRITE_SIZE;
    this.sprite = this._trainerSprite();

    // Tile-based movement properties
    this.isMoving = false;
    this.moveStartX = this.x;
    this.moveStartY = this.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.moveStartTime = 0;
    this.moveDuration = TRAINER_MOVEMENT_SPEED_MS;
    this.direction = 'down'; // current facing direction
    this.footIndex = 0; // alternates 0/1 for walk cycle
    this.currentFrame = this.frames['down'].neutral;
    this.sfxPlayer = new SfxPlayer(game.canvas);
  }
  _trainerSprite() {
    let trainer = loader.get('trainer');

    return trainer;
  }

  _startMovement(input) {
    const key = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].find((k) =>
      input.includes(k),
    );
    if (!key) return;

    const { dx, dy, dir } = directions[key];
    this.direction = dir;
    this.currentFrame = this.frames[dir].neutral; // face direction immediately

    let newTargetX = Math.max(0, Math.min(this.x + dx, MAX_TARGET_X));
    let newTargetY = Math.max(0, Math.min(this.y + dy, MAX_TARGET_Y));

    // Snap to tile grid (guards against any floating point drift)
    newTargetX = Math.floor(newTargetX / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;
    newTargetY = Math.floor(newTargetY / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;

    if (newTargetX === this.x && newTargetY === this.y) return; // canvas boundary

    // Tile-based collision — check if the target cell contains any solid tile
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

    this._updateFrame(progress);

    if (progress >= 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
      // Only alternate foot for directions that have two walk frames
      if (this.direction === 'up' || this.direction === 'down') {
        this.footIndex = 1 - this.footIndex;
      }
    }
  }

  _updateFrame(progress) {
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
      return;
    }

    if (input.length === 0) return;
    this._startMovement(input);
  }

  draw(context) {
    // Save context state before scaling
    // context.save();

    // context.fillRect(this.x, this.y, this.width, this.height);
    context.drawImage(
      this.sprite,
      this.currentFrame.x * debugScale,
      this.currentFrame.y * debugScale,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height,
    );
    // Restore context state (removes the scale)
    // context.restore();
  }
  // Frames keyed by direction — neutral + walk cycle per direction
  frames = {
    down: {
      neutral: { x: 17, y: 0 },
      walk: [
        { x: 17, y: 17 },
        { x: 17, y: 33 },
      ],
    },
    up: {
      neutral: { x: 33, y: 0 },
      walk: [
        { x: 33, y: 17 },
        { x: 33, y: 33 },
      ],
    },
    left: {
      neutral: { x: 49, y: 0 },
      walk: [
        { x: 49, y: 17 },
        { x: 49, y: 17 },
      ],
    },
    right: {
      neutral: { x: 65, y: 0 },
      walk: [
        { x: 65, y: 17 },
        { x: 65, y: 17 },
      ],
    },
  };
}
