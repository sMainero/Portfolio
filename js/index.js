import { unlockAudio } from './classes/sounds/soundPlayer.js';
import { setupMenuButton } from './utils/menuButton.js';
import { setupMuteButton } from './utils/muteButton.js';
import { setupFullscreenButton } from './utils/fullscreenButton.js';
import { preloadGames, startGames } from './utils/gameBootstrap.js';
import { loadingManager } from './utils/loadingManager.js';
import { beginCloseStartScreen } from './utils/startScreen.js';

/** @type {HTMLElement | null} */
let _startScreenElement = null;
/** @type {HTMLCanvasElement | null} */
let _mainCanvasElement = null;
/** @type {HTMLCanvasElement | null} */
let _renderCanvasElement = null;
/** @type {Promise<unknown> | null} */
let _preloadedGames = null;

window.onload = () => {
  _startScreenElement = document.getElementById('startScreen');
  _mainCanvasElement = document.getElementById('mainCanvas');
  _renderCanvasElement = document.getElementById('renderCanvas');

  setupMenuButton();
  setupMuteButton();
  setupFullscreenButton();
  loadingManager.init(
    _startScreenElement,
    document.getElementById('loadingBarContainer'),
    document.getElementById('loadingBar'),
    document.getElementById('startBtn'),
    document.getElementById('loadingText'),
  );

  _preloadedGames = preloadGames();
};

const requestPermissions = async () => {
  // iOS Safari: requestPermission MUST be called synchronously within the user
  // gesture handler — any await before it breaks the activation context and the
  // prompt will never appear. Start the request now, await the result later.
  const motionPermissionPromise =
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function'
      ? DeviceMotionEvent.requestPermission()
      : null;

  await unlockAudio();

  if (motionPermissionPromise) {
    try {
      await motionPermissionPromise;
      // Once granted, iOS delivers devicemotion events to the listener that
      // phoneMotionController registered at init time — no re-registration needed.
    } catch (error) {}
  }

  // Start the iris animation immediately — runs in parallel with game startup
  // so the user sees instant visual feedback on click.
  const removeStartScreen = beginCloseStartScreen(_startScreenElement);

  // Await the pre-loaded modules. If assets finished loading before the user
  // clicked start, these resolve instantly; otherwise they wait for the remainder.
  if (!_preloadedGames) {
    _preloadedGames = preloadGames();
  }

  // Wait for both the transition to finish AND the games to be ready, then
  // remove the element. Whichever takes longer, the screen is gone after both.
  const [remove] = await Promise.all([
    removeStartScreen,
    startGames(_preloadedGames, {
      mainCanvas: _mainCanvasElement,
      renderCanvas: _renderCanvasElement,
    }),
  ]);
  remove();
};

window.requestPermissions = requestPermissions;
