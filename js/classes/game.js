/**
 * @import {TileMap} from './tileMap.js';
 */
import { InputHandler } from '../handlers/inputHandler.js';
import { Player } from './player.js';
import { maps } from '../maps/index.js';
import { State } from './state.js';
import { Menu } from './menu.js';
import { EventTrigger } from './eventTrigger.js';
import { sfxPlayer } from './sounds/sfxPlayer.js';
import { LINK_GITHUB, LINK_LINKEDIN, LINK_CONTACT } from '../constants/links.js';

const TRANSITION_STEPS = [0.2, 0.6, 1]; // alpha at each step
const FRAMES_PER_STEP = 4; // game frames to hold each step

/**
 * Core game runtime controller for world state, input, transitions, and rendering.
 */
export class Game {
  /**
   * @type {Object.<string, EventTrigger>}
   */
  globalEventTriggers = {};

  /**
   * @param {number} width
   * @param {number} height
   * @param {HTMLCanvasElement} canvas
   * @param {TileMap} map
   */
  constructor(width, height, canvas, map) {
    this.state = new State();
    this.state.restoreStateBackup(); // attempt to restore from backup (if any)

    this.width = width;
    this.height = height;
    this.canvas = canvas;
    this.map = this.state.mapKey ? new maps[this.state.mapKey]() : map; // restore from saved key if available
    this.player = new Player(
      this,
      true,
      this.state.player.x ?? null,
      this.state.player.y ?? null,
      this.state.player.direction,
    );
    this.map.attachNpcsToGame(this);

    this.globalEventTriggers.showCredits = new EventTrigger({
      name: 'credits',
      positions: [], // not used since we'll trigger this manually from the menu
      action: 'dialog',

      dialog:
        '"Game Boy Color" by Wikiti (Sketchfab, CC BY 4.0)\nSFX created with ChipTone (SFB Games)\n\nFont: “pokemon-font” by cooljeanius (OFL 1.1) \nhttps://github.com/\ncooljeanius/\npokemon-font',
    });

    this.input = InputHandler.init();
    this.sfxPlayer = sfxPlayer;
    window.toggleSoundMute = () => {
      this.sfxPlayer.toggleMute();
      return this.sfxPlayer.isMuted;
    };
    window.sfxPlayer = this.sfxPlayer;
    this.menu = new Menu([
      { label: 'CAMERA', action: () => window.switchCameraMode?.() },
      {
        label: 'CREDIT',
        action: () => (this.state.activeEvent = this.globalEventTriggers.showCredits),
      },
      {
        label: 'MUTE',
        action: () => {
          window.onSpeakerClick();
        },
      },
      {
        label: 'FLSCRN',
        action: () => window.toggleFullscreen?.(),
      },
      {
        label: 'GITHUB',
        action: () => window.open(LINK_GITHUB, '_blank', 'noopener,noreferrer'),
      },
      {
        label: 'LNKDIN',
        action: () => window.open(LINK_LINKEDIN, '_blank', 'noopener,noreferrer'),
      },
      {
        label: 'CONTCT',
        action: () => window.open(LINK_CONTACT, '_blank', 'noopener,noreferrer'),
      },
    ]);
    this.fps = 30;
    this.frameInterval = 1000 / this.fps;
    this.lastTime = 0;
  }

  // World position of the viewport's top-left corner, keeping the player centered.
  // Math.round keeps tile draws on integer pixels, preventing sub-pixel gaps.
  get cameraX() {
    return Math.round(this.player.x - this.width / 2 + this.player.width / 2);
  }

  get cameraY() {
    return Math.round(this.player.y - this.height / 2 + this.player.height / 2);
  }

  /**
   * Convert canvas-space coordinates to world-space coordinates.
   * @param {number} canvasX
   * @param {number} canvasY
   * @returns {{ worldX: number, worldY: number }}
   */
  _toWorldPosition(canvasX, canvasY) {
    return {
      worldX: this.cameraX + canvasX,
      worldY: this.cameraY + canvasY,
    };
  }

  /**
   * Snap world coordinates to the map tile grid.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{ tileX: number, tileY: number }}
   */
  _snapToGrid(worldX, worldY) {
    const step = this.player.width;
    return {
      tileX: Math.floor(worldX / step) * step,
      tileY: Math.floor(worldY / step) * step,
    };
  }

  /**
   * Activate an event-like target (NPC or EventTrigger).
   * @param {import('./npc.js').Npc | EventTrigger} eventTrigger
   * @returns {void}
   */
  _activateEvent(eventTrigger) {
    this.player.enableMovement = false;
    eventTrigger.dialog.reset();
    eventTrigger.selectionPrompt?.reset();
    this.state.activeEvent = eventTrigger;
  }

  /**
   * Handle a click on the 2D screen canvas.
   * @param {number} canvasX
   * @param {number} canvasY
   * @returns {boolean}
   */
  handleScreenClick(canvasX, canvasY) {
    if (this.state.transition || this.menu.isOpen) return false;

    if (this.state.activeEvent) {
      // Don't advance dialog while the selection prompt is waiting for input
      if (!this.state.activeEvent.selectionPrompt?.isOpen) {
        this.state.activeEvent.dialog.advance(this);
      }
      return true;
    }

    const { worldX, worldY } = this._toWorldPosition(canvasX, canvasY);
    const { tileX, tileY } = this._snapToGrid(worldX, worldY);

    const npc = this.map.getNpcAt(tileX, tileY);
    if (npc) {
      this._activateEvent(npc);
      npc._faceToward(this.player.x, this.player.y);
      return true;
    }

    const trigger = this.map.getEventTriggerAt(tileX, tileY);
    if (trigger) {
      this._activateEvent(trigger);
      return true;
    }

    if (this.map.portal?.activateAt(tileX, tileY, this)) {
      return true;
    }

    return false;
  }

  /**
   * Initiates a map transition with fade-out/fade-in sequence.
   * @param {string} mapKey - The target map to load
   * @param {number} targetX - The player's target X position
   * @param {number} targetY - The player's target Y position
   */
  startMapTransition(mapKey, targetX, targetY) {
    this.player.enableMovement = false;
    this.state.transition = {
      phase: 'fadeOut',
      stepIndex: -1,
      framesHeld: FRAMES_PER_STEP - 1,
      mapKey,
      targetX,
      targetY,
    };
  }

  /**
   * Progress the transition fade state machine by one frame.
   * @returns {void}
   */
  updateTransition() {
    const t = this.state.transition;
    if (!t) return;

    t.framesHeld++;

    if (t.framesHeld < FRAMES_PER_STEP) return;
    t.framesHeld = 0;

    if (t.phase === 'fadeOut') {
      t.stepIndex++;

      if (t.stepIndex >= TRANSITION_STEPS.length) {
        // Fully black — swap map and teleport player
        this.loadMap(t.mapKey);
        this.player.x = t.targetX;
        this.player.y = t.targetY;
        this.state.update({ player: this.player, mapKey: t.mapKey });
        this.state.transition = {
          ...t,
          stepIndex: TRANSITION_STEPS.length - 1,
          phase: 'fadeIn',
        };
      }
    } else {
      t.stepIndex--;

      if (t.stepIndex < 0) {
        this.state.transition = null; // done
        this.player.enableMovement = true;
      }
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} width
   * @param {number} height
   */
  drawTransition(context, width, height) {
    const t = this.state.transition;
    if (!t) return;

    const stepIndex = Math.min(t.stepIndex, TRANSITION_STEPS.length - 1);
    const alpha = stepIndex < 0 ? 0 : TRANSITION_STEPS[stepIndex];
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  /**
   * Advance one simulation frame.
   * @param {number} deltaTime
   * @param {number} fps
   * @returns {void}
   */
  update(deltaTime, fps) {
    if (this.state.transition) {
      this.updateTransition();
      return; // block player input during transition
    }
    if (this.state.activeEvent) {
      if (this.state.activeEvent.selectionPrompt?.isOpen) {
        this.state.activeEvent.selectionPrompt.update(this);
      } else {
        this.state.activeEvent.dialog.update(this);
      }
      return; // block movement during dialog / prompt
    }
    // Toggle menu on p or Start
    if (this.input.keys.includes('p') || this.input.keys.includes('Start')) {
      if (!this.menu.isOpen) {
        this.input.consumeKey('p');
        this.input.consumeKey('Start');
        this.menu.open();
        return;
      }
    }
    if (this.menu.isOpen) {
      this.menu.update(this);
      return; // block player movement while menu is open
    }

    const hasMovementInput =
      this.input.keys.includes('ArrowUp') ||
      this.input.keys.includes('ArrowDown') ||
      this.input.keys.includes('ArrowLeft') ||
      this.input.keys.includes('ArrowRight');

    this.map.update(deltaTime, fps);
    this.player.update(this.input.keys, deltaTime, fps);
    this._checkInteraction();
  }

  /**
   * Load and attach a map by its key.
   * @param {keyof maps} mapKey
   * @returns {void}
   */
  loadMap(mapKey) {
    if (!maps[mapKey]) throw new Error(`Unknown map: "${mapKey}"`);
    this.map = new maps[mapKey]();
    this.map.attachNpcsToGame(this);
    this.state.update({ player: this.player, mapKey });
  }

  /**
   * Check and trigger facing interaction when Enter is pressed.
   * @returns {void}
   */
  _checkInteraction() {
    if (this.player.isMoving) return;
    if (!this.input.keys.includes('Enter')) return;
    this.input.consumeKey('Enter');
    const hit = this.map.getInteractionTarget(this.player);
    if (!hit) return;
    this._activateEvent(hit);
    // Make NPCs face the player when dialog starts
    if (hit._faceToward) {
      hit._faceToward(this.player.x, this.player.y);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @returns {void}
   */
  draw(context) {
    context.fillStyle = 'black';
    context.fillRect(0, 0, this.width, this.height);
    this.map.draw(context, this.cameraX, this.cameraY);
    this.player.draw(context);
    if (this.state.transition) this.drawTransition(context, this.width, this.height);
    this.menu.draw(context, this);
    if (this.state.activeEvent) {
      this.state.activeEvent.dialog.draw(context, this);
      this.state.activeEvent.selectionPrompt?.draw(context, this);
    }
  }
  /**
   * Main requestAnimationFrame loop.
   * @param {CanvasRenderingContext2D} context
   * @param {number} [timeStamp=0]
   * @returns {void}
   */
  animate(context, timeStamp = 0) {
    const deltaTime = timeStamp - this.lastTime;

    if (deltaTime >= this.frameInterval) {
      // Snap lastTime forward without accumulating drift
      this.lastTime = timeStamp - (deltaTime % this.frameInterval);
      context.clearRect(0, 0, this.width, this.height);
      this.update(deltaTime, this.fps);
      this.draw(context);
    }

    requestAnimationFrame((timeStamp) => this.animate(context, timeStamp));
  }
}
