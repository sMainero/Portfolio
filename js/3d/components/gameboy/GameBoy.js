import * as THREE from 'three';
import { scene } from '../scene.js';
import { canvasTexture } from './textures/canvasTexture.js';
import { dotMatrixMaterialBuilder } from './materials/dotMatrix.js';
import {
  ACTION_ZONE_A,
  ACTION_ZONE_B,
  BUTTON_PRESS_DEPTH,
  CONTROL_KEYS,
  DPAD_ROTATION_ANGLE,
  DPAD_ZONE,
} from '../../../constants/threeControls.js';
import { inputHandler } from '../../../handlers/inputHandler.js';
import { gltfModelLoader } from '../../helpers/gltfLoader.js';
import { screenLight } from './light/screenPointLight.js';
import { sfxPlayer } from '../../../classes/sounds/sfxPlayer.js';
import { SceneObject } from '../SceneObject.js';
import { CAMERA_BUTTON_STATE_RESET, cameraButtonState } from '../../helpers/cameraButtonState.js';
const CASE_COLOR = 0x8953a9;
const CASE_MESH_NAME = 'Case';
const CASE_DEFAULT_MATERIAL_NAME = 'defaultMaterial003';
/** Duration (ms) to keep the A-button press animation active after the key is consumed (~167ms). */
const PRESS_ANIM_DURATION_MS = 167;

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
export class GameBoy extends SceneObject {
  /** @type {import('../GameWorld.js').World} */
  _world = null;
  /**@type {import('../../../classes/game.js').Game} */
  _game = null;
  /** @type {THREE.Mesh | null} D-Pad cross mesh */
  dpad = null;

  /** @type {THREE.Mesh | null} A action button */
  aButton = null;

  /** @type {THREE.Mesh | null} A button label text mesh */
  aButtonText = null;

  /** @type {THREE.Mesh | null} B action button */
  bButton = null;

  /** @type {THREE.Mesh | null} B button label text mesh */
  bButtonText = null;

  /** @type {THREE.Mesh | null} Select button */
  selectButton = null;

  /** @type {THREE.Mesh | null} Start button */
  startButton = null;
  /** @type {THREE.Mesh | null} Start button */
  powerLed = null;

  /** @type {THREE.Mesh | null} Invisible collider that enlarges power LED press area */
  _powerLedHitArea = null;

  /** @type {THREE.Mesh | null} Screen plane carrying the 2D canvas texture */
  screenPlane = null;

  /** Whether the screen is currently on. */
  _screenOn = true;

  _dotMatrixMaterial = dotMatrixMaterialBuilder(canvasTexture);

  /** Target rotation angles the dpad lerps toward each frame. */
  _dpadTarget = { x: 0, z: 0 };

  /** True while a touch/pointer press is driving the dpad. */
  _touchingDpad = false;

  /** True while a touch/pointer press is driving the A button. */
  _touchingA = false;

  /** Millisecond countdown that holds the A press animation long enough for the lerp to converge. */
  _aPressAnimRemainingMs = 0;

  /** Resting Y positions captured from the mesh after the model loads. */
  _aButtonRestY = 0;
  _bButtonRestY = 0;

  /** Target Y positions the action buttons lerp toward each frame. */
  _aButtonTargetY = 0;
  _bButtonTargetY = 0;

  /**
   * @param {import('../GameWorld.js').World} world
   * @param {import('../../../classes/game.js').Game} game
   */
  constructor(world, game) {
    super();
    this._world = world;
    this._game = game;
    /**
     * @type {import('three/examples/jsm/loaders/GLTFLoader').GLTF}
     */
    const gltf = gltfModelLoader.instance.loadedModels['gameboy'];
    this._setupModel(gltf.scene);
  }

  /** Keep the canvas texture live and lerp button animations every frame. */
  onFrame(deltaSeconds) {
    canvasTexture.needsUpdate = true;
    this._syncKeyboardState(deltaSeconds);
    this._lerpDpad(deltaSeconds);
    this._lerpButtonY(this.aButton, this._aButtonTargetY, deltaSeconds);
    this._lerpButtonY(this.bButton, this._bButtonTargetY, deltaSeconds);
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
    if (key === CONTROL_KEYS.Power) {
      this._togglePower();
      return;
    }

    const isDpad = [
      CONTROL_KEYS.ArrowUp,
      CONTROL_KEYS.ArrowDown,
      CONTROL_KEYS.ArrowLeft,
      CONTROL_KEYS.ArrowRight,
    ].includes(key);
    if (isDpad) this._touchingDpad = true;
    if (key === CONTROL_KEYS.A) this._touchingA = true;
    this._aButtonTargetY = this._aButtonRestY + BUTTON_PRESS_DEPTH;
    if (key === CONTROL_KEYS.B) this._touchingB = true;
    this._bButtonTargetY = this._bButtonRestY + BUTTON_PRESS_DEPTH;
  }

  /**
   * Toggle GameBoy power state, screen visibility, and screen light intensity.
   * @returns {void}
   */
  _togglePower() {
    this._game.input.keysBlocked = !this._game.input.keysBlocked;
    this._screenOn = !this._screenOn;
    sfxPlayer.play('on');

    if (this.powerLed) {
      this.powerLed.material.transparent = true;
      this.powerLed.material.opacity = this._screenOn ? 1 : 0.1;
      this.powerLed.material.needsUpdate = true;
    }

    if (this.screenPlane) {
      this.screenPlane.visible = this._screenOn;
    }

    if (!this._screenLightBaseIntensity) {
      this._screenLightBaseIntensity = screenLight.intensity;
    }
    screenLight.intensity = this._screenOn ? this._screenLightBaseIntensity : 0;
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
    if (key === CONTROL_KEYS.B) {
      this._touchingB = false;
      this._bButtonTargetY = this._bButtonRestY;
    }
  }

  /**
   * Convert normalized screen UV coordinates into canvas pixel coordinates.
   * @param {THREE.Vector2} uv
   * @returns {{ x: number, y: number }}
   */
  _uvToCanvas(uv) {
    const u = THREE.MathUtils.clamp(uv.x, 0, 1);
    const v = THREE.MathUtils.clamp(uv.y, 0, 1);
    return {
      x: Math.floor(u * (this._game.width - 1)),
      y: Math.floor((1 - v) * (this._game.height - 1)),
    };
  }

  /**
   * Handle pointer hits against the GameBoy screen plane.
   * @param {PointerEvent} event
   * @param {THREE.Intersection} intersection
   * @returns {boolean}
   */
  hit(event, intersection) {
    if (cameraButtonState.cameraMode === CAMERA_BUTTON_STATE_RESET) window.switchCameraMode();
    if (!this.screenPlane || intersection.object !== this.screenPlane) {
      return false;
    }

    if (intersection.uv) {
      const click = this._uvToCanvas(intersection.uv);
      this._game.handleScreenClick(click.x, click.y);
    }

    return true;
  }

  // -----------------------------------------------------------------------
  // Model setup
  // -----------------------------------------------------------------------

  /**
   * @param {import('three/examples/jsm/loaders/GLTFLoader').GLTF['scene']} gltfScene
   */
  _setupModel(gltfScene) {
    const model = gltfScene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);

    model.traverse((child) => {
      if (!child.isMesh) return;

      if (child.parent?.name === CASE_MESH_NAME) {
        this._world.registerMesh(child, this);
        this._setupCase(child);
      }
      if (child.parent?.name === 'Screen') this._setupScreen(child);

      this._tryRegisterButton(child);
    });

    scene.add(model);
  }

  /** Apply the purple case colour, removing the base-map tint. */
  _setupCase(child) {
    const material = child.material;

    material.metalness = 0;
    material.roughness = 0.6;
    material.flatShading = false;

    if ('color' in material) {
      material.color = new THREE.Color(CASE_COLOR);
    }

    material.needsUpdate = true;
  }

  /**
   * Build screen plane transform for the "screen on frame" layout.
   * @param {THREE.Object3D} targetPosition
   * @param {THREE.Vector3} targetScale
   * @returns {{
   *   planePosition: { x: number, y: number, z: number },
   *   planeScale: { x: number, y: number, z: number },
   *   childVisible: boolean
   * }}
   */
  setScreenOnFrame = (targetPosition, targetScale) => {
    return {
      planePosition: {
        x: targetPosition.position.x + 0.035,
        y: targetPosition.position.y - 0.4,
        z: targetPosition.position.z + 0.3,
      },
      planeScale: {
        x: targetScale.x + 0.2,
        y: targetScale.y,
        z: targetScale.z + 0.1,
      },
      childVisible: false,
    };
  };

  /**
   * Build screen plane transform for the "screen in frame" layout.
   * @param {THREE.Vector3} targetPosition
   * @param {THREE.Vector3} targetScale
   * @returns {{
   *   planePosition: { x: number, y: number, z: number },
   *   planeScale: { x: number, y: number, z: number },
   *   childVisible: boolean
   * }}
   */
  setScreenInFrame = (targetPosition, targetScale) => {
    return {
      planePosition: {
        x: targetPosition.x + 0.04,
        y: targetPosition.y - 0.41,
        z: targetPosition.z + 0.345,
      },
      planeScale: {
        x: targetScale.x - 0.15,
        y: targetScale.y + 0.1,
        z: targetScale.z - 0.25,
      },
      childVisible: true,
    };
  };
  /** Overlay a clean PlaneGeometry carrying the dot-matrix canvas texture. */
  _setupScreen(child) {
    const screenParent = child.parent;
    const powerLed = child.children?.find((c) => c.name === 'Power_Led');

    // Point light so the screen casts green light onto surrounding geometry
    screenLight.position.copy(child.position);
    screenLight.position.y -= 0.55; // nudge up so it doesn't get blocked by the plane
    screenLight.position.z += 0.4; // nudge up so it doesn't get blocked by the plane
    // screenLight.position.z += 0.4; // nudge up so it doesn't get blocked by the plane

    screenLight.needsUpdate = true;
    screenParent.add(screenLight);

    const geo = new THREE.PlaneGeometry(1, 1);
    const plane = new THREE.Mesh(geo, this._dotMatrixMaterial);

    /**
     * With this position config
     * and setting child.visible = false, the screen will not get rendered
     * which means there will be more space for the canvas texture
     */

    const { planePosition, planeScale, childVisible } = this.setScreenInFrame(
      child.position,
      child.scale,
    );

    plane.position.copy(planePosition);
    plane.scale.copy(planeScale);
    child.visible = childVisible;

    geo.rotateX(Math.PI * 0.5);
    screenParent.add(plane);
    this.screenPlane = plane;
    this._world.registerMesh(plane, this);
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
      case 'AButtonText':
        this.aButtonText = child;
        break;
      case 'AButton':
        this.aButton = child;
        this._aButtonRestY = child.position.y;
        this._aButtonTargetY = child.position.y;
        break;
      case 'BButtonText':
        this.bButtonText = child;
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
      case 'Power_Led':
        this.powerLed = child;
        this._createPowerLedHitArea(child);

        break;
      default:
        return;
    }

    this._world.registerMesh(child, this);
  }

  /**
   * Create an invisible enlarged collider around the power LED.
   * @param {THREE.Mesh} powerLedMesh
   * @returns {void}
   */
  _createPowerLedHitArea(powerLedMesh) {
    if (this._powerLedHitArea) return;

    if (!powerLedMesh.geometry?.boundingBox) {
      powerLedMesh.geometry?.computeBoundingBox();
    }

    const bounds = powerLedMesh.geometry?.boundingBox;
    const size = new THREE.Vector3();
    bounds?.getSize(size);

    // Keep visuals unchanged: this collider is invisible but raycastable.
    const hitScale = 4;
    const hitGeo = new THREE.BoxGeometry(
      Math.max(size.x * hitScale, 0.03),
      Math.max(size.y * hitScale, 0.03),
      Math.max(size.z * hitScale, 0.03),
    );
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const hitArea = new THREE.Mesh(hitGeo, hitMat);
    hitArea.name = 'Power_Led_HitArea';
    powerLedMesh.add(hitArea);

    this._powerLedHitArea = hitArea;
    this._world.registerMesh(hitArea, this);
  }

  // -----------------------------------------------------------------------
  // Key resolution helpers
  // -----------------------------------------------------------------------

  /** Fast path: map a button mesh name to its game key. */
  _meshNameToKey(meshName = '') {
    const name = meshName.toLowerCase();

    if (name.startsWith('power_led')) {
      return CONTROL_KEYS.Power;
    }
    if (name === 'abutton' || name === 'abuttontext') {
      return CONTROL_KEYS.A;
    }

    if (name === 'bbutton' || name === 'bbuttontext') {
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

    // D-pad bounds are checked first. Any hit inside the D-pad area must
    // resolve as a direction or nothing — it must never bleed into A/B zones,
    // even when it lands in the dead zone at the centre.
    const inDpadBounds =
      this._isInBox(xN, DPAD_ZONE.minX, DPAD_ZONE.maxX) &&
      this._isInBox(zN, DPAD_ZONE.minZ, DPAD_ZONE.maxZ);

    if (inDpadBounds) {
      const dx = xN - DPAD_ZONE.centerX;
      const dz = zN - DPAD_ZONE.centerZ;
      const outsideDeadZone =
        Math.abs(dx) > DPAD_ZONE.deadZone || Math.abs(dz) > DPAD_ZONE.deadZone;

      if (!outsideDeadZone) return null;

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

    // Only reach A/B zones for hits outside the D-pad bounding area.
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

    return null;
  }

  /**
   * Check whether a value lies within [min, max].
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {boolean}
   */
  _isInBox(value, min, max) {
    return value >= min && value <= max;
  }

  /**
   * Check whether a value lies inside a symmetric range around center.
   * @param {number} value
   * @param {number} center
   * @param {number} halfSize
   * @returns {boolean}
   */
  _isNear(value, center, halfSize) {
    return value >= center - halfSize && value <= center + halfSize;
  }

  /**
   * Smoothly interpolate the dpad mesh rotation toward the current target.
   * Called every frame so the tilt eases in on press and eases out on release.
   */
  _lerpDpad(deltaSeconds) {
    if (!this.dpad) return;
    const alpha = 1 - Math.exp(-10 * deltaSeconds);
    this.dpad.rotation.x += (this._dpadTarget.x - this.dpad.rotation.x) * alpha;
    this.dpad.rotation.z += (this._dpadTarget.z - this.dpad.rotation.z) * alpha;
  }

  /**
   * Smoothly interpolate an action button Y position toward the target.
   * @param {THREE.Mesh | null} buttonMesh
   * @param {number} targetY
   * @param {number} deltaSeconds
   * @returns {void}
   */
  _lerpButtonY(buttonMesh, targetY, deltaSeconds) {
    if (!buttonMesh) return;
    const alpha = 1 - Math.exp(-10 * deltaSeconds);
    buttonMesh.position.y += (targetY - buttonMesh.position.y) * alpha;
  }

  /**
   * Mirror the current keyboard state onto the dpad/button animation targets
   * so that physical key presses drive the same visual feedback as touch presses.
   */
  _syncKeyboardState(deltaSeconds) {
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
      this._aPressAnimRemainingMs = PRESS_ANIM_DURATION_MS;
    } else if (this._aPressAnimRemainingMs > 0) {
      this._aPressAnimRemainingMs -= deltaSeconds * 1000;
    }

    if (!this._touchingA) {
      this._aButtonTargetY =
        this._aPressAnimRemainingMs > 0
          ? this._aButtonRestY + BUTTON_PRESS_DEPTH
          : this._aButtonRestY;
    }
    if (!this._touchingB) {
      this._bButtonTargetY = keys.includes(CONTROL_KEYS.B)
        ? this._bButtonRestY + BUTTON_PRESS_DEPTH
        : this._bButtonRestY;
    }
  }
}
