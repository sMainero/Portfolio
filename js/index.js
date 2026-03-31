import * as THREE from 'three';
import { startGameCourse } from './courseWay.js';
import { testThree, camera, controls } from './threeTest.js';

window.onload = () => {
  // startGame();
  startGameCourse(mainCanvas);
  testThree({ secondaryCanvas });
};

export { camera };

const animateCamera = ({ duration, toPosition, toTarget }) => {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  const easeInOut = (t) => t * t * (3 - 2 * t);

  const step = (now) => {
    const tRaw = Math.min((now - startTime) / duration, 1);
    const t = easeInOut(tRaw);

    camera.position.lerpVectors(startPos, toPosition, t);
    controls.target.lerpVectors(startTarget, toTarget, t);
    controls.update();

    if (tRaw < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

export const resetCamera = (duration = 700) => {
  animateCamera({
    duration,
    toPosition: new THREE.Vector3(-0.8, 0.4, 1.5),
    toTarget: new THREE.Vector3(0, 0, 0),
  });
};

export const setGameCamera = (duration = 700) => {
  animateCamera({
    duration,
    toPosition: new THREE.Vector3(0, 0.2, 1.3),
    toTarget: new THREE.Vector3(0, 0.2, 0),
  });
};

window.resetCamera = resetCamera;
window.setGameCamera = setGameCamera;
console.log(resetCamera);
