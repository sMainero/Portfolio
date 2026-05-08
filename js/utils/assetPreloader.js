import { sharedLoader } from './assetLoader.js';
import { CHARACTER_SPRITES } from '../classes/character.js';
import { ASSETS_BASE } from '../constants/assets.js';
import { loadMainTileset } from '../tilesets/mainTileset.js';
import { loadLogosTileset } from '../tilesets/logosTileset.js';
import { sfxPlayer, SOUND_DEFS } from '../classes/sounds/sfxPlayer.js';
import { gltfModelLoader } from '../3d/helpers/gltfLoader.js';
import { sharedTextureLoader } from './threeTextureLoader.js';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Asset manifests — add/remove entries here to change what gets loaded.
// TOTAL_LOADING_SOURCES is derived automatically from these arrays.
// ---------------------------------------------------------------------------

/** 3D models loaded via GltfModelLoader. Each entry = 1 loadingManager source. */
const GLTF_MODELS = ['gameboy'];

/** THREE.js textures. Each entry = 1 loadingManager source. */
const THREE_TEXTURES = [
  {
    key: 'buttonTexture',
    src: `${ASSETS_BASE}/button.png`,
    options: { magFilter: THREE.LinearFilter, colorSpace: THREE.SRGBColorSpace },
  },
];

/** Icon images loaded via sharedLoader for use by 3D Button instances. */
const BUTTON_ICON_PATHS = [
  { key: 'assets/icons/trophy.png', src: 'assets/icons/trophy.png' },
  { key: 'assets/icons/camera.svg', src: 'assets/icons/camera.svg' },
];

/**
 * Total number of distinct named sources that will register with loadingManager.
 * Derived from the manifest arrays above — update those arrays, not this value.
 *
 *   SOUND_DEFS.length        — one source per sound file
 *   GLTF_MODELS.length       — one source per 3D model
 *   THREE_TEXTURES.length    — one source per THREE texture
 *   + 1 (pokemonFont)        — registered in gameBootstrap._preloadFont()
 *   + 1 (images)             — all 2D images share a single averaged source
 */
export const TOTAL_LOADING_SOURCES =
  SOUND_DEFS.length + GLTF_MODELS.length + THREE_TEXTURES.length + 1 + 1;

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
  // Kick off sound loading synchronously so all sources register with
  // loadingManager before the first await — prevents bar from going backward.
  sfxPlayer.preload();

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
    // THREE textures — driven by manifest array
    ...THREE_TEXTURES.map(({ key, src, options }) => sharedTextureLoader.load(key, src, options)),
    // Sound effects — driven by SOUND_DEFS in sfxPlayer.js
    sfxPlayer.whenReady,
    // 3D models — driven by manifest array
    ...GLTF_MODELS.map((name) => gltfModelLoader.instance.loadModel(name)),
  ]);

  _mainTileset = mainTileset;
  _logosTileset = logosTileset;
};
