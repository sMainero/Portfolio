import { sharedLoader } from './assetLoader.js';
import { CHARACTER_SPRITES } from '../classes/character.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { loadMainTileset } from '../tilesets/mainTileset.js';
import { loadLogosTileset } from '../tilesets/logosTileset.js';
import { sfxPlayer } from '../classes/sounds/sfxPlayer.js';
import { gltfModelLoader } from '../3d/helpers/gltfLoader.js';
import { sharedTextureLoader } from './threeTextureLoader.js';
import * as THREE from 'three';

/**
 * Icon paths used by 3D Button instances. Loaded into sharedLoader so
 * Button._buildIconLabel resolves them synchronously via sharedLoader.get().
 * Keys match the exact iconPath strings passed to Button in 3d/index.js.
 */
const BUTTON_ICON_PATHS = [
  { key: 'assets/icons/trophy.png', src: 'assets/icons/trophy.png' },
  { key: 'assets/icons/camera.svg', src: 'assets/icons/camera.svg' },
];

/**
 * Cached tileset data objects populated by preloadGameAssets().
 * Map modules read these synchronously once the preloader has resolved.
 */
let _mainTileset = null;
let _logosTileset = null;

/**
 * Returns the preloaded main tileset data.
 * Must only be called after preloadGameAssets() has resolved.
 * @returns {{ image: HTMLImageElement, width: number, height: number, tileSize: number, tilesPerSheetRow: number }}
 */
export const getMainTileset = () => _mainTileset;

/**
 * Returns the preloaded logos tileset data.
 * Must only be called after preloadGameAssets() has resolved.
 * @returns {{ image: HTMLImageElement, width: number, height: number, tileSize: number, tilesPerSheetRow: number }}
 */
export const getLogosTileset = () => _logosTileset;

/**
 * Load ALL game assets — tilesets, character/NPC sprites, dialog border,
 * sound effects, 3D model, and 3D button texture + icons — in parallel.
 *
 * Call once (from startGameEngine.js) before instantiating any game objects.
 * This module has no top-level await so importing it never causes TDZ issues.
 * @returns {Promise<void>}
 */
export const preloadGameAssets = async () => {
  const [mainTileset, logosTileset] = await Promise.all([
    // Tilesets
    loadMainTileset(),
    loadLogosTileset(),
    // Character & NPC sprites
    ...Object.entries(CHARACTER_SPRITES).map(([key, src]) => sharedLoader.loadImage(key, src)),
    // Dialog border image
    sharedLoader.loadImage('dialogBorder', `${ASSETS_BASE}borders/BorderTileSet.png`),
    // Button icon images — keyed by path so sharedLoader.get(iconPath) works in Button
    ...BUTTON_ICON_PATHS.map(({ key, src }) => sharedLoader.loadImage(key, src)),
    // 3D button face texture
    sharedTextureLoader.load('buttonTexture', `${ASSETS_BASE}/button.png`, {
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    }),
    // Sound effects (decoded AudioBuffers via sharedSoundLoader)
    sfxPlayer.whenReady,
    // 3D GameBoy model (GltfModelLoader deduplicates if already started in gameBootstrap)
    gltfModelLoader.instance.loadModel('gameboy'),
  ]);

  _mainTileset = mainTileset;
  _logosTileset = logosTileset;
};
