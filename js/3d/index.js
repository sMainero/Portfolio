import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/game.js';
import { particles } from './geometry/particles.js';
import {
  camera,
  cameraBasePosition,
  cameraTarget,
  getCameraAnimationState,
} from './camera/camera.js';
import { scene } from './scene.js';
import { controls } from './controls/controls.js';
import { cursor } from './helpers/cursorController.js';
import { gameCameraAnimation } from './helpers/gameCameraAnimation.js';
import { resetCameraAnimation } from './helpers/resetCameraAnimation.js';
import { renderer } from './renderer/renderer.js';
import { directionalLight } from './light/directionalLight.js';
import { ambientLight } from './light/ambientLight.js';
import { canvasTexture } from './textures/canvasTexture.js';
import { dotMatrixMaterialBuilder } from './materials/dotMatrix.js';

// 🎬 Scene
scene.background = new THREE.Color(0x000000);

// 💡 Lights

scene.add(directionalLight);

scene.add(ambientLight);

// Particles
scene.add(particles);

const dotMatrixMaterial = dotMatrixMaterialBuilder(canvasTexture);
export const renderScreen = ({ renderCanvas }) => {
  // 📦 Load model
  const loader = new GLTFLoader();

  loader.load('./assets/models/GBC.glb', (gltf) => {
    const model = gltf.scene;

    // Adjust if needed
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);

    model.traverse((child) => {
      console.log('🚀 ~ index.js:47 ~ renderScreen ~ child:', child);

      if (child.isMesh && child.parent?.name === 'Screen') {
        // Hide the original atlas-mapped mesh
        child.visible = false;

        // Build a replacement plane as a child of the same "Screen" Object3D
        // so it inherits the exact world transform. PlaneGeometry has clean 0→1 UVs.
        const screenParent = child.parent; // the "Screen" Object3D

        // Match the original mesh's local transform so it sits flush on the screen.
        const geo = new THREE.PlaneGeometry(1, 1);
        const plane = new THREE.Mesh(geo, dotMatrixMaterial);
        plane.position.copy({
          x: child.position.x + 0.035,
          y: child.position.y - 0.4,
          z: child.position.z + 0.3,
        }); // slight offset to prevent z-fighting
        // plane.quaternion.copy(child.quaternion);
        geo.rotateX(Math.PI * 0.5); // orient flat in the XZ plane
        plane.scale.copy({
          x: child.scale.x + 0.2,
          y: child.scale.y,
          z: child.scale.z + 0.1,
        });

        screenParent.add(plane);
      }
    });

    scene.add(model);
  });

  // 🔄 Animation loop
  function animate() {
    requestAnimationFrame(animate);

    const animationState = getCameraAnimationState();

    // Keep parallax as an offset around the animated base camera pose.
    const parallaxStrength = 0.5;
    const offsetX = animationState.isAnimating
      ? 0
      : cursor.x * parallaxStrength;
    const offsetY = animationState.isAnimating
      ? 0
      : -cursor.y * parallaxStrength;
    const targetX = cameraBasePosition.x + offsetX;
    const targetY = cameraBasePosition.y + offsetY;
    const follow = animationState.isAnimating ? 1 : 0.08;

    camera.position.x += (targetX - camera.position.x) * follow;
    camera.position.y += (targetY - camera.position.y) * follow;
    camera.position.z += (cameraBasePosition.z - camera.position.z) * follow;

    controls.target.copy(cameraTarget);
    canvasTexture.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // 📱 Resize handling
  window.addEventListener('resize', () => {
    camera.aspect = renderCanvas.clientWidth / renderCanvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
      renderCanvas.clientWidth,
      renderCanvas.clientHeight,
      false,
    );
  });
};
