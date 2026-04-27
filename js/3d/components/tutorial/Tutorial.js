import { Text } from '../text/Text.js';
import { Toast } from './Toast.js';

/**
 * @typedef {'downRight' | 'downLeft' | 'upRight' | 'upLeft'} ArrowOrientation
 */

/**
 * @typedef {'top' | 'bottom'} ToastPosition
 */

/**
 * @typedef {{
 *   toastText: string,
 *   arrowOptions?: import('../text/Text.js').TextOptions,
 *   arrowOrientation?: ArrowOrientation,
 *   toastPosition?: ToastPosition,
 *   completionEvent?: string,
 *   completionKeys?: string[],
 * }} TutorialStep
 */

/**
 * Tutorial — base class for multi-step guided tutorials.
 *
 * Each step shows a toast popup and optionally a 3D arrow sprite in the scene.
 * A step is considered complete when either:
 *   - A named window CustomEvent fires (completionEvent), or
 *   - A keydown with a matching key fires (completionKeys), or
 *   - The user presses the ✕ dismiss button on the toast.
 *
 * Completion state is persisted in localStorage so the tutorial never repeats
 * on the same device/browser profile.
 *
 * Subclasses define the step list and pass it via super(name, steps).
 * The World entity interface (onAddedToWorld, onFrame) is implemented here so
 * instances can be added to a World directly: world.add(new MyTutorial()).
 */
export class Tutorial {
  /** @type {string} */
  _name;
  /** @type {boolean} */
  done;
  /** @type {TutorialStep[]} */
  _steps;
  /** @type {number} */
  _currentStepIndex = 0;
  /** @type {Text | null} */
  _currentArrow = null;
  /** @type {Array<() => void>} */
  _cleanupFns = [];

  /**
   * @param {string} name - unique identifier; used as localStorage key suffix
   * @param {TutorialStep[]} steps
   */
  constructor(name, steps) {
    this._name = name;
    this._steps = steps;
    this.done = this._isDone();
  }

  /**
   * Check if tutorial has already been completed on this device/profile.
   * @returns {boolean}
   */
  _isDone() {
    return localStorage.getItem(`tutorialDone-${this._name}`) === 'true';
  }

  /** Mark the tutorial complete, persist to localStorage, and clean up. */
  finish() {
    this.done = true;
    localStorage.setItem(`tutorialDone-${this._name}`, 'true');
    Toast.getInstance().hide();
    this._removeCurrentArrow();
    this._cleanupCurrentListeners();
  }

  /** Begin the tutorial from step 0. No-op if already done. */
  start() {
    if (this.done) return;
    this._activateStep(0);
  }

  /**
   * Activate a tutorial step by index.
   * @param {number} index
   * @returns {void}
   */
  _activateStep(index) {
    this._removeCurrentArrow();
    this._cleanupCurrentListeners();

    if (index >= this._steps.length) {
      this.finish();
      return;
    }

    this._currentStepIndex = index;
    const step = this._steps[index];

    Toast.getInstance().show({
      text: step.toastText,
      position: step.toastPosition ?? 'bottom',
      onDismiss: () => this._advanceStep(),
    });

    if (step.arrowOptions) {
      const resolvedArrowText = this._resolveArrowText(step.arrowOrientation);
      const arrowMotionDirection = this._resolveArrowMotionDirection(step.arrowOrientation);
      this._currentArrow = new Text({
        ...step.arrowOptions,
        text: resolvedArrowText ?? step.arrowOptions.text,
        movementDirectionX: step.arrowOptions.movementDirectionX ?? arrowMotionDirection.x,
        movementDirectionY: step.arrowOptions.movementDirectionY ?? arrowMotionDirection.y,
      });
    }

    if (step.completionEvent) {
      const handler = () => this._advanceStep();
      window.addEventListener(step.completionEvent, handler, { once: true });
      this._cleanupFns.push(() => window.removeEventListener(step.completionEvent, handler));
    }

    if (step.completionKeys?.length) {
      const keys = step.completionKeys;
      const handler = (e) => {
        if (keys.includes(e.key)) this._advanceStep();
      };
      window.addEventListener('keydown', handler);
      this._cleanupFns.push(() => window.removeEventListener('keydown', handler));
    }
  }

  /**
   * Move tutorial forward to the next step or finish it.
   * @returns {void}
   */
  _advanceStep() {
    const next = this._currentStepIndex + 1;
    if (next >= this._steps.length) {
      this.finish();
    } else {
      this._activateStep(next);
    }
  }

  /**
   * Remove the currently displayed arrow object, if any.
   * @returns {void}
   */
  _removeCurrentArrow() {
    this._currentArrow?.remove();
    this._currentArrow = null;
  }

  /**
   * Dispose active step listeners.
   * @returns {void}
   */
  _cleanupCurrentListeners() {
    for (const cleanup of this._cleanupFns) cleanup();
    this._cleanupFns = [];
  }

  /**
   * @param {ArrowOrientation | undefined} orientation
   * @returns {string | null}
   */
  _resolveArrowText(orientation) {
    const normalized = String(orientation ?? '')
      .trim()
      .replace(/\s+/g, '')
      .toLowerCase();

    switch (normalized) {
      case 'downright':
        return '↘';
      case 'downleft':
        return '↙';
      case 'upleft':
        return '↖';
      case 'upright':
        return '↗';
      default:
        return null;
    }
  }

  /**
   * @param {ArrowOrientation | undefined} orientation
   * @returns {{x: number, y: number}}
   */
  _resolveArrowMotionDirection(orientation) {
    const normalized = String(orientation ?? '')
      .trim()
      .replace(/\s+/g, '')
      .toLowerCase();

    switch (normalized) {
      case 'downright':
        return { x: 0.7071, y: -0.7071 };
      case 'downleft':
        return { x: -0.7071, y: -0.7071 };
      case 'upleft':
        return { x: -0.7071, y: 0.7071 };
      case 'upright':
        return { x: 0.7071, y: 0.7071 };
      default:
        return { x: 1, y: 1 };
    }
  }

  // --- World entity interface ---

  /**
   * World lifecycle hook.
   * @returns {void}
   */
  onAddedToWorld() {
    this.start();
  }

  /**
   * Per-frame update hook.
   * @param {number} deltaSeconds
   * @returns {void}
   */
  onFrame(deltaSeconds) {
    this._currentArrow?.onFrame?.(deltaSeconds);
  }
}
