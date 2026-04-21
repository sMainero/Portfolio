import * as THREE from 'three';
import { camera } from './camera/camera.js';
import { scene } from './scene.js';

/**
 * Base class for 3D scene objects.
 *
 * Provides a shared _updateScreenAnchor() that pins this.mesh to a
 * screen-space corner every frame, driven by the live camera state.
 *
 * Subclasses opt in by passing `anchor: { enabled: true, ... }` to super().
 * When anchor is disabled the mesh stays wherever it was positioned at build time.
 *
 * @typedef {{
 *   enabled?: boolean,
 *   distance?: number,
 *   marginX?: number,
 *   marginY?: number,
 * }} AnchorOptions
 */
export class SceneObject {
  _anchorEnabled = false;
  _anchorDistance = 2;
  _anchorMarginX = 0;
  _anchorMarginY = 0;
  _mediaQuery = null;

  _cameraRight = new THREE.Vector3();
  _cameraUp = new THREE.Vector3();
  _cameraForward = new THREE.Vector3();
  _anchorPoint = new THREE.Vector3();

  /**
   * @param {{ anchor?: AnchorOptions, mediaQuery?: string }} options
   */
  constructor({ anchor, mediaQuery } = {}) {
    if (anchor?.enabled) {
      this._anchorEnabled = true;
      if (anchor.distance !== undefined) this._anchorDistance = anchor.distance;
      if (anchor.marginX !== undefined) this._anchorMarginX = anchor.marginX;
      if (anchor.marginY !== undefined) this._anchorMarginY = anchor.marginY;
    }
    if (mediaQuery) this._mediaQuery = mediaQuery;
  }

  onAddedToWorld(world) {
    if (!this._mediaQuery || !this.mesh) return;
    const mql = window.matchMedia(this._mediaQuery);
    const apply = (matches) => {
      this.mesh.visible = matches;
    };
    apply(mql.matches);
    mql.addEventListener('change', (e) => apply(e.matches));
  }

  _updateScreenAnchor() {
    if (!this.mesh) return;
    const distance = this._anchorDistance;
    const halfHeight =
      Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
    const halfWidth = halfHeight * camera.aspect;

    const offsetRight = halfWidth - this._anchorMarginX;
    const offsetUp = halfHeight - this._anchorMarginY;

    camera.getWorldDirection(this._cameraForward);
    this._cameraForward.normalize();

    this._cameraRight
      .set(1, 0, 0)
      .applyQuaternion(camera.quaternion)
      .normalize();
    this._cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize();

    this._anchorPoint
      .copy(camera.position)
      .addScaledVector(this._cameraForward, distance)
      .addScaledVector(this._cameraRight, offsetRight)
      .addScaledVector(this._cameraUp, offsetUp);

    this.mesh.position.copy(this._anchorPoint);
  }

  hit(e) {}

  /** Remove this object's mesh from the scene and dispose GPU resources. */
  remove() {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.material?.map?.dispose();
      this.material?.dispose();
      this.mesh = null;
      this.material = null;
    }
  }

  onFrame(deltaSeconds) {
    if (this._anchorEnabled) this._updateScreenAnchor();
  }
}
