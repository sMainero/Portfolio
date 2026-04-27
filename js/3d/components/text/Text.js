import { scene } from '../scene.js';
import * as THREE from 'three';
import { SceneObject } from '../SceneObject.js';

/**
 * @typedef {{text: string, size?: number, color?: number, borderColor?: number,variateMovement?: boolean, movementVariationX?: number, movementVariationY?: number, movementDirectionX?: number, movementDirectionY?: number, mediaQuery?: string, anchor?: import('../SceneObject.js').AnchorOptions, position?: {x: number, y: number, z: number}}} TextOptions
 */
export class Text extends SceneObject {
  text = '';
  size = 1;
  color = 0xffffff;
  borderColor = 0x000000;
  position = new THREE.Vector3(0, 0, 0);
  material = null;
  mesh = null;
  movementVariationX = Math.random() * 1000; // for subtle desynchronized bobbing
  movementVariationY = Math.random() * 1000; // for subtle desynchronized bobbing
  movementDirectionX = 1;
  movementDirectionY = 1;
  variateMovement = false;
  _startPosition = this.position.clone();
  /**
   * @param {TextOptions} options
   */
  constructor({
    text,
    size,
    color,
    borderColor,
    position,
    anchor,
    mediaQuery,
    variateMovement,
    movementVariationX,
    movementVariationY,
    movementDirectionX,
    movementDirectionY,
  }) {
    super({ anchor, mediaQuery });
    this.text = text;
    if (position) {
      this.position = new THREE.Vector3(position.x, position.y, position.z);
      this._startPosition = this.position.clone();
    }
    this.variateMovement = variateMovement ?? this.variateMovement;
    this.movementVariationX = movementVariationX ?? this.movementVariationX;
    this.movementVariationY = movementVariationY ?? this.movementVariationY;
    this.movementDirectionX = movementDirectionX ?? this.movementDirectionX;
    this.movementDirectionY = movementDirectionY ?? this.movementDirectionY;

    this.size = size ?? this.size;
    this.color = color ?? this.color;
    this.borderColor = borderColor ?? this.borderColor;
    this.build();
    this.draw();
  }

  /**
   * Build sprite material and mesh for this text object.
   * @returns {this}
   */
  build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const fontSize = 64 * dpr;
    const border = 12 * dpr;
    const padding = border * 2;

    const fillColor = '#' + this.color.toString(16).padStart(6, '0');
    const strokeColor = '#' + this.borderColor.toString(16).padStart(6, '0');

    // Measure text first
    const lines = this.text.split('\n');
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.font = `${fontSize}px Pokemon`;
    const textWidth = Math.ceil(Math.max(...lines.map((l) => tmpCtx.measureText(l).width)));

    const canvas = document.createElement('canvas');
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize * lines.length + padding * 2;

    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px Pokemon`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = border * 2;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    lines.forEach((line, index) => {
      const y = canvas.height / 2 - ((lines.length - 1) * fontSize) / 2 + index * fontSize;
      ctx.strokeText(line, canvas.width / 2, y);
      ctx.fillText(line, canvas.width / 2, y);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      toneMapped: false,
    });

    this.mesh = new THREE.Sprite(this.material);
    const spriteHeight = this.size * lines.length;
    const spriteWidth = spriteHeight * (canvas.width / canvas.height);
    this.mesh.scale.set(spriteWidth, spriteHeight, 1);
    this.mesh.position.copy(this.position);
    return this;
  }

  /**
   * Add the sprite mesh to the scene.
   * @returns {void}
   */
  draw() {
    if (this.mesh) scene.add(this.mesh);
  }
  /**
   * Optional per-frame floating motion.
   * @param {number} [_deltaSeconds]
   * @returns {void}
   */
  onFrame(_deltaSeconds) {
    if (this.variateMovement) {
      const offset = Math.sin((Date.now() + this.movementVariationX) / 300) * 0.02;
      this.position.x = this._startPosition.x + offset * this.movementDirectionX;
      this.position.y = this._startPosition.y + offset * this.movementDirectionY;
      if (this.mesh) this.mesh.position.copy(this.position);
    }

    // this.position.x = this._startPosition.x + Math.sin(Date.now() / 200) * 0.02;
    // this.position.y = this._startPosition.y + Math.sin(Date.now() / 200) * 0.02;
    // if (this.mesh) this.mesh.position.copy(this.position);
  }
}
