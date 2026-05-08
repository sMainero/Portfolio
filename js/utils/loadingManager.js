/** @type {HTMLElement | null} */
let barElement = null;
/** @type {HTMLElement | null} */
let buttonElement = null;
/** @type {HTMLElement | null} */
let textElement = null;
/** @type {HTMLElement | null} */
let barContainerElement = null;
/** @type {HTMLElement | null} */
let startScreenElement = null;
/** @type {Record<string, number>} source name → progress 0–100 */
const loadingSources = {};
let _domBound = false;
/** Fixed denominator — set via setTotal() before any sources register. */
let _totalSources = 0;

const dots = ['', '.', '..', '...'];
let dotIndex = 0;
/** @type {ReturnType<typeof setInterval> | null} */
let dotsInverval = null;
const startLoadingTextInterval = () => {
  if (!dotsInverval) {
    dotIndex = 0;
    dotsInverval = setInterval(() => {
      if (textElement) textElement.textContent = `Booting up${dots[dotIndex]}`;
      dotIndex = (dotIndex + 1) % dots.length;
    }, 500);
  }
};

const clearLoadingTextInterval = () => {
  if (dotsInverval) {
    clearInterval(dotsInverval);
    dotsInverval = null;
  }
};
const _flush = () => {
  const values = Object.values(loadingSources);
  if (!values.length) return;

  const denominator = _totalSources > 0 ? _totalSources : values.length;
  const percentage = values.reduce((a, b) => a + b, 0) / denominator;
  startLoadingTextInterval();

  if (barElement) barElement.style.width = `${percentage}%`;
  if (barElement) barElement.setAttribute('aria-valuenow', String(Math.round(percentage)));
  if (percentage >= 100 && buttonElement) {
    clearLoadingTextInterval();
    if (textElement) textElement.textContent = 'System ready';
    buttonElement.hidden = false;
  }
};

const _update = (name, percentage) => {
  loadingSources[name] = Math.min(100, percentage);
  if (_domBound) _flush();
};

export const loadingManager = {
  /**
   * Register a named loading source. Returns an onProgress(percentage: 0–100) callback.
   * Safe to call before init() — updates are buffered and flushed when the DOM binds.
   * @param {string} name
   * @returns {(percentage: number) => void}
   */
  register(name) {
    // Only skip registration if the start screen is actively disconnected (post-game).
    // Allowing registration before init() is intentional — updates are buffered.
    if (startScreenElement && !startScreenElement.isConnected) {
      return;
    }
    loadingSources[name] = 0;
    return (percentage) => _update(name, percentage);
  },

  /**
   * Bind the DOM elements. Immediately flushes current buffered progress.
   * @param {HTMLElement} barContainerEl
   * @param {HTMLElement} barEl
   * @param {HTMLElement} btnEl
   * @param {HTMLElement} textEl
   */
  /**
   * Set the fixed total number of loading sources.
   * Call this before any register() calls so the bar denominator never changes.
   * @param {number} total
   */
  setTotal(total) {
    _totalSources = total;
  },

  init(startScreenEl, barContainerEl, barEl, btnEl, textEl) {
    startScreenElement = startScreenEl;
    barContainerElement = barContainerEl;
    barElement = barEl;
    buttonElement = btnEl;
    textElement = textEl;
    _domBound = true;
    _flush();
  },
};
