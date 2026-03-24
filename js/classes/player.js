import { CANVAS_HEIGHT, CANVAS_WIDTH, TILE_SIZE } from '../constants/game.js';
import { AssetLoader } from '../utils/assetLoader.js';

const TRAINER_SPRITE_SIZE = 64;
const TRAINER_MOVE_STEP = 64;
const TRAINER_MOVEMENT_SPEED_MS = 350; // Time to move one tile (in milliseconds)
const MAX_TARGET_X = CANVAS_WIDTH - TRAINER_SPRITE_SIZE;

console.log('🚀 ~ player.js:9 ~ MAX_TARGET_X:', MAX_TARGET_X);

const MAX_TARGET_Y = CANVAS_HEIGHT - TRAINER_SPRITE_SIZE;

console.log('🚀 ~ player.js:13 ~ MAX_TARGET_Y:', MAX_TARGET_Y);

const loader = new AssetLoader();
await loader.loadImage(
  'trainer',
  '../assets/sprites/pokemon_gen_1_trainer_sprite.png',
);

const debugScale = 4;
export class Player {
  constructor(game) {
    this.game = game;
    this.width = TRAINER_SPRITE_SIZE;
    this.height = TRAINER_SPRITE_SIZE;
    // Start at tile-aligned position (multiple of TRAINER_MOVE_STEP)
    this.x = TRAINER_MOVE_STEP;
    this.y = TRAINER_MOVE_STEP;
    this.sprite = this._trainerSprite();

    // Tile-based movement properties
    this.isMoving = false;
    this.moveStartX = this.x;
    this.moveStartY = this.y;
    this.targetX = this.x;
    this.targetY = this.y;
    this.moveStartTime = 0;
    this.moveDuration = TRAINER_MOVEMENT_SPEED_MS;
    this.lastMovementDirection = 'down';
    this.currentFrame = this.frames.neutralDown;
    this.lastFrameVariation = 1;
  }
  _trainerSprite() {
    let trainer = loader.get('trainer');

    return trainer;
  }

  update(input, deltaTime) {
    // If currently moving, animate to target position
    if (this.isMoving) {
      const elapsed = Date.now() - this.moveStartTime;
      const progress = Math.min(elapsed / this.moveDuration, 1); // 0 to 1

      // Linear interpolation from start to target
      this.x = this.moveStartX + (this.targetX - this.moveStartX) * progress;
      this.y = this.moveStartY + (this.targetY - this.moveStartY) * progress;

      let movementDirection = this.calculateMovementDirection(
        this.moveStartX,
        this.moveStartY,
        this.targetX,
        this.targetY,
      );

      if (progress >= 0.25 && progress < 0.75) {
        if (movementDirection === 'down') {
          if (this.lastFrameVariation === 1) {
            this.currentFrame = this.frames.walkDown1;
          } else {
            this.currentFrame = this.frames.walkDown2;
          }
        } else if (movementDirection === 'up') {
          if (this.lastFrameVariation === 1) {
            this.currentFrame = this.frames.walkUp1;
          } else {
            this.currentFrame = this.frames.walkUp2;
          }
        } else if (movementDirection === 'left') {
          this.currentFrame = this.frames.walkLeft;
        } else if (movementDirection === 'right') {
          this.currentFrame = this.frames.walkRight;
        }
      } else if (progress >= 0.75) {
        if (movementDirection === 'down') {
          this.currentFrame = this.frames.neutralDown;
        } else if (movementDirection === 'up') {
          this.currentFrame = this.frames.neutralUp;
        } else if (movementDirection === 'left') {
          this.currentFrame = this.frames.neutralLeft;
        } else if (movementDirection === 'right') {
          this.currentFrame = this.frames.neutralRight;
        }
      }
      // Movement complete
      if (progress >= 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.lastMovementDirection = movementDirection;
        this.lastFrameVariation = this.lastFrameVariation === 1 ? 2 : 1;
      }

      return; // Don't process new input while moving
    }

    // Not moving - check for input to start new movement
    if (input.length === 0) return;

    let newTargetX = this.x;
    let newTargetY = this.y;

    // Determine target position based on input (prioritize one direction)
    if (input.includes('ArrowUp')) {
      newTargetY = this.y - TRAINER_MOVE_STEP;
    } else if (input.includes('ArrowDown')) {
      newTargetY = this.y + TRAINER_MOVE_STEP;
    } else if (input.includes('ArrowLeft')) {
      newTargetX = this.x - TRAINER_MOVE_STEP;
    } else if (input.includes('ArrowRight')) {
      newTargetX = this.x + TRAINER_MOVE_STEP;
    }

    // Apply collision bounds to target position and snap to tile grid
    // Clamp to valid range
    newTargetX = Math.max(0, Math.min(newTargetX, MAX_TARGET_X));

    console.log(
      '🚀 ~ player.js:130 ~ Player ~ update ~ newTargetX:',
      newTargetX,
    );

    newTargetY = Math.max(0, Math.min(newTargetY, MAX_TARGET_Y));

    // Snap to tile-aligned positions (multiples of TRAINER_MOVE_STEP)
    newTargetX = Math.floor(newTargetX / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;

    console.log(
      '🚀 ~ player.js:140 ~ Player ~ update ~ newTargetX:',
      newTargetX,
    );

    newTargetY = Math.floor(newTargetY / TRAINER_MOVE_STEP) * TRAINER_MOVE_STEP;

    // Only start moving if target is different from current position
    if (newTargetX !== this.x || newTargetY !== this.y) {
      this.moveStartX = this.x;
      this.moveStartY = this.y;
      this.targetX = newTargetX;
      this.targetY = newTargetY;
      this.moveStartTime = Date.now();
      this.isMoving = true;
    }
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
    console.log(this);
    // Restore context state (removes the scale)
    // context.restore();
  }
  frames = {
    neutralDown: { x: 17, y: 0 },
    walkDown1: { x: 17, y: 17 },
    walkDown2: { x: 17, y: 33 },
    neutralUp: { x: 33, y: 0 },
    walkUp1: { x: 33, y: 17 },
    walkUp2: { x: 33, y: 33 },
    neutralLeft: { x: 49, y: 0 },
    walkLeft: { x: 49, y: 17 },
    neutralRight: { x: 65, y: 0 },
    walkRight: { x: 65, y: 17 },
  };

  calculateMovementDirection(startX, startY, targetX, targetY) {
    if (targetY < startY) return 'up';
    if (targetY > startY) return 'down';
    if (targetX < startX) return 'left';
    if (targetX > startX) return 'right';
    return '';
  }
}
