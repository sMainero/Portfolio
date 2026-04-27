import { Scene } from 'three';

export class SceneContext {
  /**
   * @type {Scene}
   */
  _scene = null;

  constructor() {
    this._scene = new Scene();
  }

  /** @returns {Scene} */
  get scene() {
    if (!this._scene) throw new Error('Scene is not initialized');
    return this._scene;
  }
}

export const sceneContext = new SceneContext();
export const scene = sceneContext.scene;
