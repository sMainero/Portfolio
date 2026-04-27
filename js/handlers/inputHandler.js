const ALLOWED_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w',
  'a',
  's',
  'd',
  'W',
  'A',
  'S',
  'D',
  'p',
  'P',
  'Enter',
  'Start',
  'Escape',
  ' ',
  'Delete',
  'Backspace',
];

const KEY_MAPS = {
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  w: 'ArrowUp',
  a: 'ArrowLeft',
  s: 'ArrowDown',
  d: 'ArrowRight',
  W: 'ArrowUp',
  A: 'ArrowLeft',
  S: 'ArrowDown',
  D: 'ArrowRight',
  p: 'p',
  P: 'P',
  Enter: 'Enter',
  ' ': 'Enter',
  Start: 'Start',
  Escape: 'Escape',
  Delete: 'Escape',
  Backspace: 'Escape',
};

/**
 * Singleton instance — initialised once by Game, then importable anywhere.
 * @type {InputHandler | null}
 */
let _instance = null;

/**
 * Keyboard input manager with mapped action keys.
 */
export class InputHandler {
  /**
   * @type {boolean} If true, all input is blocked
   */
  keysBlocked = false;
  /**
   * Register keyboard listeners and initialize pressed-key buffer.
   */
  constructor() {
    this.keys = [];

    window.addEventListener('keydown', (e) => {
      if (ALLOWED_KEYS.includes(e.key) && !e.repeat) {
        e.preventDefault(); // stop arrow keys from scrolling the page
        this._addKey(KEY_MAPS[e.key]);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (ALLOWED_KEYS.includes(e.key)) {
        this._removeKey(KEY_MAPS[e.key]);
      }
    });
  }

  /**
   * Add a mapped key to the active pressed set.
   * @param {string} key
   * @returns {void}
   */
  _addKey(key) {
    if (this.keysBlocked) return;
    if (this.keys.indexOf(key) === -1) this.keys.push(key);
  }

  /**
   * Remove a mapped key from the active pressed set.
   * @param {string} key
   * @returns {void}
   */
  _removeKey(key) {
    const idx = this.keys.indexOf(key);
    if (idx !== -1) this.keys.splice(idx, 1);
  }

  /** Removes a key immediately — forces the user to release and re-press to trigger again. */
  /**
   * @param {string} key
   * @returns {void}
   */
  consumeKey(key) {
    if (this.keysBlocked) return;
    this._removeKey(key);
  }

  /**
   * Initialize and return singleton InputHandler instance.
   * @returns {InputHandler}
   */
  static init() {
    if (!_instance) _instance = new InputHandler();
    return _instance;
  }
}

/** Shared InputHandler — available after Game has been constructed. */
export const inputHandler = {
  get instance() {
    return _instance;
  },
};
