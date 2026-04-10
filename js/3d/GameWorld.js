import * as THREE from 'three';
import { particles, updateParticles } from './geometry/particles.js';
import {
  camera,
  cameraBasePosition,
  cameraTarget,
  getCameraAnimationState,
} from './camera/camera.js';
import { scene } from './scene.js';
import { controls } from './controls/controls.js';
import { cursor } from './helpers/cursorController.js';
import { motion, isMotionEnabled } from './helpers/phoneMotionController.js';
import { renderer, composer } from './renderer/renderer.js';
import { directionalLight } from './light/directionalLight.js';
import { ambientLight } from './light/ambientLight.js';

/**
 * World — container for all 3D objects in the scene.
 *
 * Owns the Three.js environment (scene, lights, camera loop, input pipeline)
 * and holds a collection of independent entities. Each entity is added via
 * world.add(entity), which gives the entity a reference back to the world so
 * it can register its own interactable meshes after async loading.
 *
 * Entities are plain objects (no base class required) that implement:
 *   onAddedToWorld(world)              called by world.add() — start setup here
 *   resolveKey(intersection) → string  map a raycaster hit to a key string
 *   onPress(mesh, key)                 press animation / visual feedback
 *   onRelease(mesh, key)               release animation / reset
 *   onFrame()                          called every animation frame
 *
 * Entities register clickable surfaces with:
 *   world.registerMesh(mesh, entity)   make the mesh raycaster-detectable
 *   world.unregisterMesh(mesh)         undo the above
 */
export class World {
  _entities = [];
  _meshToEntity = new Map();
  _activeButtons = new Map();

  _raycaster = new THREE.Raycaster();
  _pointer = new THREE.Vector2();

  _motionBaseline = { x: 0, y: 0 };
  _hasMotionBaseline = false;
  constructor() {
    scene.background = new THREE.Color(0x000000);
    scene.add(directionalLight, ambientLight, particles);
  }

  // -----------------------------------------------------------------------
  // Entity management
  // -----------------------------------------------------------------------

  /**
   * Add an entity to the world.
   * Calls entity.onAddedToWorld(this) so the entity can start loading and
   * registering its meshes.
   */
  add(entity) {
    this._entities.push(entity);
    return this;
  }

  /**
   * Make a mesh detectable by the world's raycaster and associate it with
   * the entity that owns it. Call this from inside onAddedToWorld or
   * after async loading completes.
   * @param {THREE.Mesh} mesh
   * @param {object} entity
   */
  registerMesh(mesh, entity) {
    this._meshToEntity.set(mesh, entity);
  }

  /** Remove a mesh from the raycaster registry. */
  unregisterMesh(mesh) {
    this._meshToEntity.delete(mesh);
  }

  // -----------------------------------------------------------------------
  // Loop
  // -----------------------------------------------------------------------

  /**
   * Start the render loop, bind pointer events, and attach resize handling.
   * @param {HTMLElement} renderCanvas
   */
  startLoop(renderCanvas) {
    this._bindPointerEvents();
    this._animate();
    window.addEventListener('resize', () => this._onResize(renderCanvas));
    this._onResize(renderCanvas);
  }

  // -----------------------------------------------------------------------
  // Input
  // -----------------------------------------------------------------------

  _dispatchGameKey(type, key) {
    window.dispatchEvent(
      new KeyboardEvent(type, { key, bubbles: true, cancelable: true }),
    );
  }

  _updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _getHit(event) {
    if (!this._meshToEntity.size) return null;
    this._updatePointer(event);
    this._raycaster.setFromCamera(this._pointer, camera);
    const meshes = [...this._meshToEntity.keys()];
    const hits = this._raycaster.intersectObjects(meshes, true);
    return hits[0] ?? null;
  }

  _onPointerDown = (event) => {
    const intersection = this._getHit(event);
    if (!intersection) return;

    const entity = this._meshToEntity.get(intersection.object);
    if (!entity) return;

    const key = entity.resolveKey(intersection);
    if (!key) return;

    this._activeButtons.set(event.pointerId, {
      key,
      mesh: intersection.object,
      entity,
    });
    entity.onPress(intersection.object, key);
    this._dispatchGameKey('keydown', key);
    event.preventDefault();
  };

  _onPointerUp = (event) => {
    const active = this._activeButtons.get(event.pointerId);
    if (!active) return;
    const { key, mesh, entity } = active;
    entity.onRelease(mesh, key);
    this._dispatchGameKey('keyup', key);
    this._activeButtons.delete(event.pointerId);
    event.preventDefault();
  };

  _bindPointerEvents() {
    renderer.domElement.addEventListener('pointerdown', this._onPointerDown, {
      passive: false,
    });
    window.addEventListener('pointerup', this._onPointerUp, { passive: false });
    window.addEventListener('pointercancel', this._onPointerUp, {
      passive: false,
    });
  }

  // -----------------------------------------------------------------------
  // Animation loop
  // -----------------------------------------------------------------------

  _animate = () => {
    requestAnimationFrame(this._animate);

    const animationState = getCameraAnimationState();

    if (
      !this._hasMotionBaseline &&
      (Math.abs(motion.x) > 0.3 || Math.abs(motion.y) > 0.3)
    ) {
      this._motionBaseline.x = motion.x;
      this._motionBaseline.y = motion.y;
      this._hasMotionBaseline = true;
    }

    const parallaxStrength = 0.6;
    const motionXNorm = this._hasMotionBaseline
      ? THREE.MathUtils.clamp((motion.x - this._motionBaseline.x) / 9.81, -1, 1)
      : 0;
    const motionYNorm = this._hasMotionBaseline
      ? THREE.MathUtils.clamp((motion.y - this._motionBaseline.y) / 9.81, -1, 1)
      : 0;

    const motionEnabled = isMotionEnabled();
    const offsetX = animationState.isAnimating
      ? 0
      : (cursor.x + (motionEnabled ? motionXNorm : 0)) * parallaxStrength;
    const offsetY = animationState.isAnimating
      ? 0
      : -(cursor.y + (motionEnabled ? motionYNorm : 0)) * parallaxStrength;

    const targetX = cameraBasePosition.x + offsetX;
    const targetY = cameraBasePosition.y + offsetY;
    const follow = animationState.isAnimating ? 1 : 0.08;

    camera.position.x += (targetX - camera.position.x) * follow;
    camera.position.y += (targetY - camera.position.y) * follow;
    camera.position.z += (cameraBasePosition.z - camera.position.z) * follow;

    controls.target.copy(cameraTarget);

    for (const entity of this._entities) entity.onFrame?.();

    controls.update();
    updateParticles(camera.position);
    composer.render();
  };

  _onResize(renderCanvas) {
    camera.aspect = renderCanvas.clientWidth / renderCanvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
      renderCanvas.clientWidth,
      renderCanvas.clientHeight,
      false,
    );
    composer.setSize(renderCanvas.clientWidth, renderCanvas.clientHeight);
  }
}
