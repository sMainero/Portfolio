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

  static getInstance() {
    if (!Toast._instance) {
      Toast._instance = new Toast();
    }
    return Toast._instance;
  }

  constructor() {
    this._element = document.getElementById('toast');
    this._textEl = document.getElementById('toastText');
    const closeBtn = document.getElementById('toastClose');

    if (!this._element || !this._textEl || !closeBtn) {
      throw new Error('Toast markup is missing in index.html');
    }

    closeBtn.addEventListener('click', () => this._handleDismiss());
  }

  _handleDismiss() {
    this._onDismiss?.();
    this.hide();
  }

  /**
   * @param {{ text: string, position?: 'top' | 'bottom', onDismiss?: () => void }} options
   */
  show({ text, position = 'bottom', onDismiss = null }) {
    this._textEl.textContent = text;
    this._onDismiss = onDismiss;
    this._element.classList.remove('toast--top', 'toast--bottom');
    this._element.classList.add(position === 'top' ? 'toast--top' : 'toast--bottom');
    this._element.classList.remove('toast--hidden');
  }

  hide() {
    this._element.classList.add('toast--hidden');
    this._onDismiss = null;
  }
}
