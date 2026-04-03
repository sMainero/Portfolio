import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from './scene.js';
import { canvasTexture } from './textures/canvasTexture.js';
import { dotMatrixMaterialBuilder } from './materials/dotMatrix.js';
import {
  ACTION_ZONE_A,
  ACTION_ZONE_B,
  BUTTON_PRESS_DEPTH,
  CONTROL_KEYS,
  DPAD_ROTATION_ANGLE,
  DPAD_ZONE,
} from '../constants/threeControls.js';
import { inputHandler } from '../handlers/inputHandler.js';

const MODEL_PATH = './assets/models/GBC.glb';
const CASE_COLOR = 0x8953a9;

/** Frames to keep the A-button press animation active after the key is consumed (~167ms at 60fps). */
const PRESS_ANIM_FRAMES = 10;

/**
 * GameBoy — standalone entity representing the GBC model.
 *
 * Lives inside a World instance; the World calls onAddedToWorld(world) when
 * the entity is added, which triggers model loading and mesh registration.
 *
 * Once loaded, each physical button is exposed as a named property so
 * animations can target them directly, e.g.:
 *   gameboy.dpad.rotation.z = 0.1;
 *   gameboy.aButton.position.y -= 0.01;
 *
 * Implement press / release animations in onPress() and onRelease().
 */
export class GameBoy {
  /** @type {import('./GameWorld.js').World} */
  _world = null;

  /** @type {THREE.Mesh | null} D-Pad cross mesh */
  dpad = null;

  /** @type {THREE.Mesh | null} A action button */
  aButton = null;

  /** @type {THREE.Mesh | null} B action button */
  bButton = null;

  /** @type {THREE.Mesh | null} Select button */
  selectButton = null;

  /** @type {THREE.Mesh | null} Start button */
  startButton = null;

  _dotMatrixMaterial = dotMatrixMaterialBuilder(canvasTexture);

  /** Target rotation angles the dpad lerps toward each frame. */
  _dpadTarget = { x: 0, z: 0 };

  /** True while a touch/pointer press is driving the dpad. */
  _touchingDpad = false;

  /** True while a touch/pointer press is driving the A button. */
  _touchingA = false;

  /** Frame countdown that holds the A press animation long enough for the lerp to converge. */
  _aPressAnimFrames = 0;

  /** Resting Y positions captured from the mesh after the model loads. */
  _aButtonRestY = 0;
  _bButtonRestY = 0;

  /** Target Y positions the action buttons lerp toward each frame. */
  _aButtonTargetY = 0;
  _bButtonTargetY = 0;
  constructor(world) {
    this._world = world;
    this._loadModel();
  }

  /** Keep the canvas texture live and lerp button animations every frame. */
  onFrame() {
    canvasTexture.needsUpdate = true;
    this._syncKeyboardState();
    this._lerpDpad();
    this._lerpButtonY(this.aButton, this._aButtonTargetY);
    this._lerpButtonY(this.bButton, this._bButtonTargetY);
  }

  /**
   * Map a raycaster hit to a key string.
   * DPadButton requires position-based resolution (one mesh, multiple zones).
   * All other buttons are fully identified by their mesh name.
   * @param {THREE.Intersection} intersection
   * @returns {string | null}
   */
  resolveKey(intersection) {
    if (intersection.object.name === 'DPadButton') {
      return this._keyFromHitPosition(intersection);
    }
    return this._meshNameToKey(intersection.object.name);
  }

  /**
   * Set the animation target for the pressed button.
   * @param {THREE.Mesh} _mesh
   * @param {string} key
   */
  onPress(_mesh, key) {
    const isDpad = [
      CONTROL_KEYS.ArrowUp,
      CONTROL_KEYS.ArrowDown,
      CONTROL_KEYS.ArrowLeft,
      CONTROL_KEYS.ArrowRight,
    ].includes(key);
    if (isDpad) this._touchingDpad = true;
    if (key === CONTROL_KEYS.A) this._touchingA = true;
    this._aButtonTargetY = this._aButtonRestY + BUTTON_PRESS_DEPTH;
    if (key === CONTROL_KEYS.B)
      this._bButtonTargetY = this._bButtonRestY + BUTTON_PRESS_DEPTH;
  }

  /**
   * Reset the animation target for the released button.
   * @param {THREE.Mesh} _mesh
   * @param {string} key
   */
  onRelease(_mesh, key) {
    const isDpad = [
      CONTROL_KEYS.ArrowUp,
      CONTROL_KEYS.ArrowDown,
      CONTROL_KEYS.ArrowLeft,
      CONTROL_KEYS.ArrowRight,
    ].includes(key);
    if (isDpad) {
      this._touchingDpad = false;
      this._dpadTarget.x = 0;
      this._dpadTarget.z = 0;
    }
    if (key === CONTROL_KEYS.A) {
      this._touchingA = false;
      this._aButtonTargetY = this._aButtonRestY;
    }
    if (key === CONTROL_KEYS.B) this._bButtonTargetY = this._bButtonRestY;
  }

  // -----------------------------------------------------------------------
  // Model loading
  // -----------------------------------------------------------------------

  _loadModel() {
    const loader = new GLTFLoader();

    loader.load(MODEL_PATH, (gltf) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);

      model.traverse((child) => {
        if (!child.isMesh) return;
        if (child.parent?.name === 'Case') this._setupCase(child);
        if (child.parent?.name === 'Screen') this._setupScreen(child);
        this._tryRegisterButton(child);
      });

      scene.add(model);
    });
  }

  /** Apply the purple case colour, removing the base-map tint. */
  _setupCase(child) {
    const material = child.material;
    if ('map' in material) material.map = null;
    if ('color' in material) material.color = new THREE.Color(CASE_COLOR);
    material.needsUpdate = true;
  }

  /** Overlay a clean PlaneGeometry carrying the dot-matrix canvas texture. */
  _setupScreen(child) {
    const screenParent = child.parent;
    const geo = new THREE.PlaneGeometry(1, 1);
    const plane = new THREE.Mesh(geo, this._dotMatrixMaterial);

    /**
     * With this position config
     * and setting child.visible = false, the screen will not get rendered
     * which means there will be more space for the canvas texture
     */

    // child.visible = false;

    //  plane.position.copy({
    //   x: child.position.x + 0.035,
    //   y: child.position.y - 0.4,
    //   z: child.position.z + 0.3,
    // }); // slight offset to prevent z-fighting
    // // plane.quaternion.copy(child.quaternion);
    // geo.rotateX(Math.PI * 0.5); // orient flat in the XZ plane
    // plane.scale.copy({
    //   x: child.scale.x + 0.2,
    //   y: child.scale.y,
    //   z: child.scale.z + 0.1,
    // });

    plane.position.copy({
      x: child.position.x + 0.04,
      y: child.position.y - 0.41,
      z: child.position.z + 0.35,
    });
    geo.rotateX(Math.PI * 0.5);
    plane.scale.copy({
      x: child.scale.x - 0.18,
      y: child.scale.y + 0.1,
      z: child.scale.z - 0.26,
    });

    screenParent.add(plane);
  }

  /**
   * Store the mesh ref on the named property and register it with the world
   * so the raycaster can detect presses on it.
   */
  _tryRegisterButton(child) {
    switch (child.name) {
      case 'DPadButton':
        this.dpad = child;
        break;
      case 'AButton':
        this.aButton = child;
        this._aButtonRestY = child.position.y;
        this._aButtonTargetY = child.position.y;
        break;
      case 'BButton':
        this.bButton = child;
        this._bButtonRestY = child.position.y;
        this._bButtonTargetY = child.position.y;
        break;
      case 'SelectButton':
        this.selectButton = child;
        break;
      case 'StartButton':
        this.startButton = child;
        break;
      default:
        return;
    }

    this._world.registerMesh(child, this);
  }

  // -----------------------------------------------------------------------
  // Key resolution helpers
  // -----------------------------------------------------------------------

  /** Fast path: map a button mesh name to its game key. */
  _meshNameToKey(meshName = '') {
    const name = meshName.toLowerCase();

    if (name === 'abutton') {
      return CONTROL_KEYS.A;
    }

    if (name === 'bbutton') {
      return CONTROL_KEYS.B;
    }

    if (name.includes('start')) return CONTROL_KEYS.Start;
    if (name.includes('select')) return CONTROL_KEYS.Select;

    return null;
  }

  /**
   * Slow path: normalise the hit point into [0,1] space within the mesh's
   * bounding box, compare against configured zones, and apply dpad tilt.
   * Only called for DPadButton — never for named action/start/select buttons.
   */
  _keyFromHitPosition(intersection) {
    const object = intersection.object;
    const geometry = object.geometry;

    if (!geometry?.boundingBox) geometry?.computeBoundingBox();
    const bounds = geometry?.boundingBox;
    if (!bounds) return null;

    const localPoint = object.worldToLocal(intersection.point.clone());
    const width = bounds.max.x - bounds.min.x || 1;
    const depth = bounds.max.z - bounds.min.z || 1;
    const xN = (localPoint.x - bounds.min.x) / width;
    const zN = (localPoint.z - bounds.min.z) / depth;

    if (
      this._isNear(xN, ACTION_ZONE_A.centerX, ACTION_ZONE_A.halfSize) &&
      this._isNear(zN, ACTION_ZONE_A.centerZ, ACTION_ZONE_A.halfSize)
    ) {
      return CONTROL_KEYS.A;
    }

    if (
      this._isNear(xN, ACTION_ZONE_B.centerX, ACTION_ZONE_B.halfSize) &&
      this._isNear(zN, ACTION_ZONE_B.centerZ, ACTION_ZONE_B.halfSize)
    ) {
      return CONTROL_KEYS.B;
    }

    const dx = xN - DPAD_ZONE.centerX;
    const dz = zN - DPAD_ZONE.centerZ;

    const inDpadBounds =
      this._isInBox(xN, DPAD_ZONE.minX, DPAD_ZONE.maxX) &&
      this._isInBox(zN, DPAD_ZONE.minZ, DPAD_ZONE.maxZ);
    const outsideDeadZone =
      Math.abs(dx) > DPAD_ZONE.deadZone || Math.abs(dz) > DPAD_ZONE.deadZone;

    if (inDpadBounds && outsideDeadZone) {
      if (Math.abs(dx) > Math.abs(dz)) {
        if (dx > 0) {
          this._dpadTarget.x = 0;
          this._dpadTarget.z = DPAD_ROTATION_ANGLE;
          return CONTROL_KEYS.ArrowRight;
        } else {
          this._dpadTarget.x = 0;
          this._dpadTarget.z = -DPAD_ROTATION_ANGLE;
          return CONTROL_KEYS.ArrowLeft;
        }
      }
      if (dz > 0) {
        this._dpadTarget.x = -DPAD_ROTATION_ANGLE;
        this._dpadTarget.z = 0;
        return CONTROL_KEYS.ArrowUp;
      } else {
        this._dpadTarget.x = DPAD_ROTATION_ANGLE;
        this._dpadTarget.z = 0;
        return CONTROL_KEYS.ArrowDown;
      }
    }

    console.log('[3d-buttons] Unmapped hit zone', {
      name: object.name,
      xN: Number(xN.toFixed(3)),
      zN: Number(zN.toFixed(3)),
      localX: Number(localPoint.x.toFixed(3)),
      localY: Number(localPoint.y.toFixed(3)),
      localZ: Number(localPoint.z.toFixed(3)),
      uvX: Number((intersection.uv?.x ?? 0).toFixed(3)),
      uvY: Number((intersection.uv?.y ?? 0).toFixed(3)),
    });

    return null;
  }

  _isInBox(value, min, max) {
    return value >= min && value <= max;
  }

  _isNear(value, center, halfSize) {
    return value >= center - halfSize && value <= center + halfSize;
  }

  /**
   * Smoothly interpolate the dpad mesh rotation toward the current target.
   * Called every frame so the tilt eases in on press and eases out on release.
   */
  _lerpDpad() {
    if (!this.dpad) return;
    const speed = 0.18;
    this.dpad.rotation.x += (this._dpadTarget.x - this.dpad.rotation.x) * speed;
    this.dpad.rotation.z += (this._dpadTarget.z - this.dpad.rotation.z) * speed;
  }

  _lerpButtonY(buttonMesh, targetY) {
    if (!buttonMesh) return;
    const speed = 0.18;
    buttonMesh.position.y += (targetY - buttonMesh.position.y) * speed;
  }

  /**
   * Mirror the current keyboard state onto the dpad/button animation targets
   * so that physical key presses drive the same visual feedback as touch presses.
   */
  _syncKeyboardState() {
    const keys = inputHandler.instance?.keys;

    if (!keys) return;

    const up = keys.includes(CONTROL_KEYS.ArrowUp);
    const down = keys.includes(CONTROL_KEYS.ArrowDown);
    const left = keys.includes(CONTROL_KEYS.ArrowLeft);
    const right = keys.includes(CONTROL_KEYS.ArrowRight);
    const a = keys.includes(CONTROL_KEYS.A);

    // Dpad — only apply from keyboard when the touch path isn't already driving it
    if (up) {
      this._dpadTarget.x = -DPAD_ROTATION_ANGLE;
      this._dpadTarget.z = 0;
    } else if (down) {
      this._dpadTarget.x = DPAD_ROTATION_ANGLE;
      this._dpadTarget.z = 0;
    } else if (left) {
      this._dpadTarget.x = 0;
      this._dpadTarget.z = -DPAD_ROTATION_ANGLE;
    } else if (right) {
      this._dpadTarget.x = 0;
      this._dpadTarget.z = DPAD_ROTATION_ANGLE;
    } else if (!this._touchingDpad) {
      // Only reset if touch input isn't holding a direction
      this._dpadTarget.x = 0;
      this._dpadTarget.z = 0;
    }

    // A button — hold the pressed target for several frames so the lerp fully converges
    // even when consumeKey() removes the key before the next sync tick.
    if (a) {
      this._aPressAnimFrames = PRESS_ANIM_FRAMES;
    } else if (this._aPressAnimFrames > 0) {
      this._aPressAnimFrames--;
    }

    if (!this._touchingA) {
      this._aButtonTargetY =
        this._aPressAnimFrames > 0
          ? this._aButtonRestY + BUTTON_PRESS_DEPTH
          : this._aButtonRestY;
    }
  }
}
