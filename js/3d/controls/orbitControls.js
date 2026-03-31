import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
