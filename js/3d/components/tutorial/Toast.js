/**
 * Toast — singleton HTML overlay that shows a step hint at the bottom
 * of the screen. Exposes show() / hide() and an ✕ dismiss button.
 */
export class Toast {
  /** @type {Toast | null} */
  static _instance = null;

  /** @type {HTMLElement} */
  _element;
  /** @type {HTMLParagraphElement} */
  _textEl;
  /** @type {(() => void) | null} */
  _onDismiss = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  _autoHideTimer = null;
  /** @type {(() => void) | null} */
  _textClickHandler = null;

  /**
   * @returns {Toast}
   */
  static getInstance() {
    if (!Toast._instance) {
      Toast._instance = new Toast();
    }
    return Toast._instance;
  }

  /**
   * Resolve required DOM nodes and bind dismiss handler.
   */
  constructor() {
    this._element = document.getElementById('toast');
    this._textEl = document.getElementById('toastText');
    const closeBtn = document.getElementById('toastClose');

    if (!this._element || !this._textEl || !closeBtn) {
      throw new Error('Toast markup is missing in index.html');
    }

    closeBtn.addEventListener('click', () => this._handleDismiss());
  }

  /**
   * Handle toast dismiss action.
   * @returns {void}
   */
  _handleDismiss() {
    const onDismiss = this._onDismiss;
    this.hide();
    onDismiss?.();
  }

  /**
   * @param {{ text: string, position?: 'top' | 'bottom', onDismiss?: () => void, onClick?: (() => void) | null, autoHideMs?: number }} options
   */
  show({ text, position = 'bottom', onDismiss = null, onClick = null, autoHideMs = 0 }) {
    // Clear any pending auto-hide and previous click handler before re-showing.
    this._clearTimerAndClickHandler();

    this._textEl.textContent = text;
    this._onDismiss = onDismiss;

    if (onClick) {
      this._textClickHandler = () => {
        this.hide();
        onClick();
      };
      this._textEl.addEventListener('click', this._textClickHandler);
      this._textEl.classList.add('toast__text--action');
    }

    this._element.classList.remove('toast--top', 'toast--bottom');
    this._element.classList.add(position === 'top' ? 'toast--top' : 'toast--bottom');
    this._element.classList.remove('toast--hidden');

    if (autoHideMs > 0) {
      this._autoHideTimer = setTimeout(() => {
        this._autoHideTimer = null;
        this.hide();
      }, autoHideMs);
    }
  }

  /**
   * @returns {void}
   */
  hide() {
    this._clearTimerAndClickHandler();
    this._element.classList.add('toast--hidden');
    this._onDismiss = null;
  }

  /**
   * Clear auto-hide timer and remove any action click handler from the text element.
   * @returns {void}
   */
  _clearTimerAndClickHandler() {
    if (this._autoHideTimer !== null) {
      clearTimeout(this._autoHideTimer);
      this._autoHideTimer = null;
    }
    if (this._textClickHandler) {
      this._textEl.removeEventListener('click', this._textClickHandler);
      this._textClickHandler = null;
      this._textEl.classList.remove('toast__text--action');
    }
  }
}
