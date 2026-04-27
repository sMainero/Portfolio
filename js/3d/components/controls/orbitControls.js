import { Camera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * @typedef {Object} OrbitControlsOptions
 * @property {Camera} camera
 * @property {HTMLElement} domElement
 * @property {Vector3} target
 */

/**
 * @param {OrbitControlsOptions} options
 * @returns {OrbitControls}
 */
export const createOrbitControls = ({ camera, domElement, target }) => {
  const controls = new OrbitControls(camera, domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxZoom = 2;
  controls.minZoom = 0.5;
  controls.target.copy(target);
  controls.update();
  return controls;
};
