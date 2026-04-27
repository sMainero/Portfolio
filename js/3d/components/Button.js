import { ASSETS_BASE } from '../../constants/assets.js';
import { World } from './GameWorld.js';
import { scene, SceneContext } from './scene.js';
import * as THREE from 'three';
import { SceneObject } from './SceneObject.js';
import { sharedLoader } from '../../utils/assetLoader.js';
import { sharedTextureLoader } from '../../utils/threeTextureLoader.js';
import { TRAINER_MOVE_STEP } from '../../constants/movement.js';
import { TileMap } from '../../classes/tileMap.js';
import { maps } from '../../maps/index.js';
import { Game } from '../../classes/game.js';

/**
 * @typedef {Object} PortalTransition
 * @property {keyof maps} mapKey - The key of the target map in the maps object.
 * @property {number} targetX - The X coordinate on the target map to teleport to.
 * @property {number} targetY - The Y coordinate on the target map to teleport to.
 */

/**
 * @typedef {Object} ButtonOptions
 * @property {'text' | 'icon'} [labelType]
 * @property {string} [labelText]
 * @property {string} [iconPath]
 * @property {string} [floatingText]
 * @property {{ x: number, y: number, z: number }} [position]
 * @property {(() => void) | null} [onClick]
 * @property {PortalTransition | null} [portalTransition]
 */

const spinsAmount = 16;

const spinDuration = 800; // ms for the entire spin

/**
 * 3D interactive button with optional icon/text face and floating label.
 */
export class Button extends SceneObject {
  portal = null;
  /**
   * @type {SceneContext['scene']}
   */
  _scene = null;
  /**
   * @type {THREE.MeshBasicMaterial}
   */
  material = null;

  /**
   * @type {THREE.BoxGeometry}
   */
  geometry = null;

  /**
   * @type {THREE.Mesh}
   */
  mesh = null;

  /**
   * @type {World}
   */
  _world = null;
  /**
   * @type {THREE.Object3D | null}
   */
  label = null;

  _baseY = 1.1;
  _elapsedTime = 0;
  _isHovered = false;

  _isSpinning = false;
  _spinAccum = 0;
  _currentSpin = 0;
  _spinInterval = spinDuration / spinsAmount / 1000; // seconds between ticks
  _spinTimeAccum = 0;

  _labelType = 'text';
  _labelText = 'START';
  _iconPath = `${ASSETS_BASE}/icons/camera.svg`;
  _floatingText = '';
  _floatingTextOffsetY = -0.22;
  /** @type {THREE.Sprite | null} */
  _floatingTextSprite = null;
  /** @type {(() => void) | null} */
  _onClick = null;
  /** @type {Game} */
  _game = null;

  /**
   * @type {PortalTransition | null}
   */

  _portalTransition = null;

  /**
   *
   * @param {World} world
   * @param {Game} game
   * @param {ButtonOptions | string} [options={}]
   *
   */
  constructor(world, game, options = {}) {
    super({
      anchor: { enabled: false, distance: 2, marginX: 0.15, marginY: 0.15 },
    });
    this._scene = scene;
    this._world = world;
    this._game = game;
    if (typeof options === 'string') {
      this._labelType = 'text';
      this._labelText = options;
      this._position = { x: 0.4, y: 1.2, z: 0.1 };
    } else {
      this._labelType = options.labelType ?? 'text';
      this._labelText = options.labelText ?? 'START';
      this._iconPath = options.iconPath ?? `${ASSETS_BASE}/icons/camera.svg`;
      this._floatingText = options.floatingText ?? '';
      this._position = options.position ?? { x: 0.4, y: 1.2, z: 0.1 };
      this._onClick = options.onClick ?? null;
      this._portalTransition = options.portalTransition ?? null;
    }

    const map =
      sharedTextureLoader.get('buttonTexture') ??
      (() => {
        const t = new THREE.TextureLoader().load(`${ASSETS_BASE}/button.png`);
        t.magFilter = THREE.LinearFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
    this.material = new THREE.MeshBasicMaterial({
      map: map,
      opacity: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2, 1, 1, 1);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(this._position.x, this._position.y, this._position.z);
    this.mesh.renderOrder = 1000;
    // this._updateScreenAnchor();
    this._baseY = this.mesh.position.y;
    this._scene.add(this.mesh);
    this._world.registerMesh(this.mesh, this);
    // this.mesh.quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 1.15, 0)) ;
    // this.mesh.rotation.z = Math.PI * 1.25;
    if (this._labelType === 'icon') {
      this._buildIconLabel(this._iconPath).then((label) => {
        if (!label) return;
        this.label = label;
        this.mesh.add(label);
        this._world.registerMesh(label, this);
      });
    } else {
      this._buildTextLabel(this._labelText).then((label) => {
        if (!label) return;
        this.label = label;
        this.mesh.add(label);
        this._world.registerMesh(label, this);
      });
    }

    if (this._floatingText) {
      this._buildFloatingText(this._floatingText).then((sprite) => {
        if (!sprite) return;
        this._floatingTextSprite = sprite;
        this._scene.add(sprite);
        this._syncFloatingTextPosition();
      });
    }
  }

  /**
   * Build a text label sprite for the button face.
   * @param {string} labelText
   * @returns {Promise<THREE.Sprite | null>}
   */
  async _buildTextLabel(labelText) {
    await document.fonts.load('bold 48px Pokemon');
    return this._createTextSprite({
      text: labelText,
      fontSize: 24,
      padding: 24,
      spriteHeight: 0.16,
      zOffset: 0.21,
      renderOrder: 1001,
    });
  }

  /**
   * Build an icon label mesh for the button face.
   * @param {string} iconPath
   * @returns {Promise<THREE.Mesh | null>}
   */
  async _buildIconLabel(iconPath) {
    const image = sharedLoader.get(iconPath);
    if (!image) return null;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);

    // Build white mask of the icon
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = size;
    maskCanvas.height = size;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;
    const drawSize = Math.floor(size * 0.62);
    const drawOffset = Math.floor((size - drawSize) / 2);
    maskCtx.drawImage(image, drawOffset, drawOffset, drawSize, drawSize);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fillRect(0, 0, size, size);

    // Stamp white outline around the icon
    const outlineRadius = 5;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const dx = Math.round(Math.cos(angle) * outlineRadius);
      const dy = Math.round(Math.sin(angle) * outlineRadius);
      ctx.drawImage(maskCanvas, dx, dy, size, size);
    }

    // Draw the original icon on top
    ctx.drawImage(image, drawOffset, drawOffset, drawSize, drawSize);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      opacity: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    // Sticker plane mounted on the front face of the button.
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), material);
    label.renderOrder = 1001;
    // Position just above the front face (box depth is 0.2, half-depth is 0.1).
    label.position.set(0, 0, 0.101);
    return label;
  }

  /**
   * Build a floating text sprite rendered below the button mesh.
   * @param {string} text
   * @returns {Promise<THREE.Sprite>}
   */
  async _buildFloatingText(text) {
    await document.fonts.load('bold 36px Pokemon');
    return this._createTextSprite({
      text,
      fontSize: 20,
      padding: 16,
      spriteHeight: 0.1,
      zOffset: 0,
      renderOrder: 1002,
    });
  }

  /**
   * Create a text sprite from a string with consistent styling.
   * @param {{ text: string, fontSize: number, padding: number, spriteHeight: number, zOffset: number, renderOrder: number }} options
   * @returns {THREE.Sprite | null}
   */
  _createTextSprite({ text, fontSize, padding, spriteHeight, zOffset, renderOrder }) {
    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const actualFontSize = fontSize * dpr;
    const actualPadding = padding * dpr;
    const fillColor = '#ffffff';

    const tmpCtx = canvas.getContext('2d');
    if (!tmpCtx) return null;

    canvas.height = actualFontSize + actualPadding * 2;
    tmpCtx.font = `bold ${actualFontSize}px Pokemon`;
    canvas.width = Math.ceil(tmpCtx.measureText(text).width) + actualPadding * 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.font = `bold ${actualFontSize}px Pokemon`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.fillStyle = fillColor;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      opacity: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const label = new THREE.Sprite(material);
    const spriteWidth = spriteHeight * (canvas.width / canvas.height);
    label.scale.set(spriteWidth, spriteHeight, 1);
    label.position.set(0, 0, zOffset);
    label.renderOrder = renderOrder;
    return label;
  }

  /**
   * Keep the floating text aligned below the button position.
   * @returns {void}
   */
  _syncFloatingTextPosition() {
    if (!this._floatingTextSprite || !this.mesh) return;
    this._floatingTextSprite.position.set(
      this.mesh.position.x,
      this.mesh.position.y + this._floatingTextOffsetY,
      this.mesh.position.z,
    );
  }

  /**
   * Mark button as hovered and set pointer cursor.
   * @returns {void}
   */
  onHoverStart() {
    this._isHovered = true;
    document.body.style.cursor = 'pointer';
  }

  /**
   * Clear hover state and restore default cursor.
   * @returns {void}
   */
  onHoverEnd() {
    this._isHovered = false;
    document.body.style.cursor = '';
  }

  /**
   * Run one incremental spin animation step.
   * @param {number} deltaMs
   * @returns {Promise<void>}
   */
  async _spin(deltaMs) {
    this._spinTimeAccum += deltaMs;

    return new Promise((resolve, reject) => {
      if (this._spinTimeAccum >= this._spinInterval) {
        this.mesh.rotation.x += Math.PI / 8;
        this._spinTimeAccum = 0;
        this._currentSpin++;
        if (this._currentSpin >= spinsAmount) {
          this._currentSpin = 0;
          resolve();
        }
        // this.mesh.rotation.y += Math.PI / 8;
      }
    })
      .then(() => {})
      .catch((err) => {})
      .finally(() => {
        this._isSpinning = false;
      });
  }

  /**
   * Handle raycast click on the button.
   * @param {Event} e
   * @returns {void}
   */
  hit(e) {
    if (this._portalTransition && this._game) {
      const { mapKey, targetX, targetY } = this._portalTransition;
      this._game.startMapTransition(
        mapKey,
        targetX * TRAINER_MOVE_STEP,
        targetY * TRAINER_MOVE_STEP,
      );
      setTimeout(() => {
        window.switchCameraMode?.();
      }, 800);
    } else {
      this._onClick?.();
    }
    this._isSpinning = true;
  }
  /**
   * Button does not map to keyboard keys.
   * @returns {undefined}
   */
  resolveKey() {
    return;
  }
  /**
   * Per-frame update (look-at, spin, hover bobbing).
   * @param {number} deltaSeconds
   * @returns {void}
   */
  onFrame(deltaSeconds) {
    this._elapsedTime += deltaSeconds;

    if (!this._isSpinning) {
      this.mesh.lookAt(this._camera.position);
    } else {
      this._spin(deltaSeconds);
    }
    super.onFrame(deltaSeconds);
    const targetY = this._baseY + Math.sin(this._elapsedTime * 4) * 0.03;
    const smoothing = Math.min(deltaSeconds * 10, 1);

    if (this._isHovered) {
      this.mesh.position.y += (targetY - this.mesh.position.y) * smoothing;
    } else {
      this.mesh.position.y += (this._baseY - this.mesh.position.y) * smoothing;
    }

    // this._syncFloatingTextPosition();
  }

  /**
   * Remove button resources from the scene.
   * @returns {void}
   */
  remove() {
    if (this._floatingTextSprite) {
      this._scene.remove(this._floatingTextSprite);
      this._floatingTextSprite.material?.map?.dispose();
      this._floatingTextSprite.material?.dispose();
      this._floatingTextSprite = null;
    }
    super.remove();
  }
}
