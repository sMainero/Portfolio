import * as THREE from 'three';
import { scene } from '../scene.js';
import { Text } from './Text.js';

// Module-level temp so the overridden build() can read arc config while
// it's being invoked from the Text parent constructor (before CurvedText's
// own constructor body has run and set instance fields).
let _pendingArc = null;

const FONT_SIZE = 64; // px — canvas resolution
const STROKE_WIDTH = 10; // px
const STROKE_PAD = 6; // px per side, prevents stroke clipping
const DESCENDER_PAD = 4; // extra bottom room for Safari glyph clipping

/**
 * @typedef {{
 *   center: {x: number, y: number, z: number},
 *   radius: number,
 *   angle?: number,
 *   lineGap?: number,
 *   tilt?: number,
 * }} ArcOptions
 *
 * @typedef {{
 *   text: string,
 *   size: number,
 *   color: number,
 *   arc: ArcOptions,
 *   anchor?: import('../SceneObject.js').AnchorOptions,
 *   mediaQuery?: string,
 * }} CurvedTextOptions
 */

export class CurvedText extends Text {
  /**
   * @param {CurvedTextOptions} options
   */
  constructor(options) {
    // Store arc config BEFORE super() so the overridden build() can read it
    // when the Text constructor triggers the polymorphic call.
    _pendingArc = options.arc;
    super(options);
    _pendingArc = null;
  }

  /**
   * Build curved text mesh group.
   * @returns {this}
   */
  build() {
    const arc = _pendingArc;

    // Fallback to flat sprite if no arc config provided
    if (!arc) return super.build();

    const {
      center = { x: 0, y: 0, z: 0 },
      radius,
      angle = -Math.PI / 2,
      lineGap = 1.2,
      tilt = 0,
    } = arc;

    const fillColor = '#' + this.color.toString(16).padStart(6, '0');
    const centerVec = new THREE.Vector3(center.x, center.y, center.z);
    const lines = this.text.split('\n');
    const outerGroup = new THREE.Group();

    lines.forEach((line, lineIndex) => {
      const lineRadius = radius + lineIndex * this.size * lineGap;
      outerGroup.add(this._buildLine(line, lineRadius, angle, centerVec, fillColor));
    });

    outerGroup.rotation.z = (tilt * Math.PI) / 180;

    // Assign to this.mesh so SceneObject's anchor / media-query features work
    this.mesh = outerGroup;
  }

  /**
   * @param {string} line
   * @param {number} radius
   * @param {number} centerAngle - angle where the text is centred (radians)
   * @param {THREE.Vector3} center
   * @param {string} fillColor - CSS colour string
   */
  _buildLine(line, radius, centerAngle, center, fillColor) {
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.font = `${FONT_SIZE}px Pokemon`;

    const chars = line.split('');
    const fallbackAscent = FONT_SIZE * 0.8;
    const fallbackDescent = FONT_SIZE * 0.25;
    const charMetrics = chars.map((char) => {
      const metrics = tmpCtx.measureText(char);
      const width = metrics.width;
      const ascent = metrics.actualBoundingBoxAscent || fallbackAscent;
      const descent = metrics.actualBoundingBoxDescent || fallbackDescent;
      return { width, ascent, descent };
    });
    const totalWidth = charMetrics.reduce((s, metric) => s + metric.width, 0);

    const pixelsToWorld = this.size / FONT_SIZE;
    const totalAngle = (totalWidth * pixelsToWorld) / radius;

    let a = centerAngle - totalAngle / 2;
    const group = new THREE.Group();

    chars.forEach((char, i) => {
      const { width, ascent, descent } = charMetrics[i];
      const charWorldW = width * pixelsToWorld;
      const charAngle = charWorldW / radius;
      const placementAngle = a + charAngle / 2;

      // ── Per-character canvas ──────────────────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cw = Math.max(1, Math.ceil(width) + STROKE_PAD * 2);
      const ch = Math.ceil(ascent + descent) + STROKE_PAD * 2 + DESCENDER_PAD;
      const baselineY = STROKE_PAD + ascent;
      const canvas = document.createElement('canvas');
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.font = `${FONT_SIZE}px Pokemon`;
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
      ctx.lineWidth = STROKE_WIDTH;
      ctx.strokeStyle = 'black';
      ctx.fillStyle = fillColor;
      ctx.strokeText(char, STROKE_PAD, baselineY);
      ctx.fillText(char, STROKE_PAD, baselineY);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const planeH = this.size;
      const planeW = planeH * (cw / ch);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), material);

      mesh.position.set(
        center.x + radius * Math.cos(placementAngle),
        center.y + radius * Math.sin(placementAngle),
        center.z,
      );
      // Rotate so each glyph's baseline is tangent to the arc
      mesh.rotation.z = placementAngle + Math.PI / 2;

      group.add(mesh);
      a += charAngle;
    });

    return group;
  }

  /**
   * Add curved text mesh to the scene.
   * @returns {void}
   */
  draw() {
    if (this.mesh) scene.add(this.mesh);
  }
}
