import * as THREE from 'three';
import { camera } from './camera/camera.js';
import { scene } from './scene.js';

/**
 * Base class for 3D scene objects.
 *
 * Provides a shared _updateScreenAnchor() that pins this.mesh to a
 * screen-space corner every frame, driven by the live camera state.
 *
 *
 */
export class SceneObject {
  _mediaQuery = null;
  _camera = camera;

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
