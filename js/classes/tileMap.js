import { createTileReference } from '../utils/tileReference.js';
import { Npc } from './npc.js';

/**
 * @typedef {{ sheetName: string, tileIndex: number }} TileReference
 */

/**
 * TileMap handles rendering the tilemap and collision detection based on a 2D array of tile IDs.
 * @param {Array<Array<number|string|TileReference>>} mapData - 2D array of tile IDs or tile references, indexed as [row][col].
 * @param {Set<number|string|TileReference>|Record<string, Set<number|string|TileReference>>} solidTileIds
 *   Set of solid tile IDs/references or a map of tileset name to solid IDs.
 * @param {number} scaledTileSize - Size of each tile on the canvas in pixels.
 * @param {number} tileScaling - Scale factor applied when drawing tiles.
 * @param {Record<string, {image: HTMLImageElement, width: number, height: number, tileSize: number}>} tileSheets
 *   An object describing one or more tilesheets keyed by name.
 * @param {string} defaultTileSheetName - The tilesheet to use for numeric tile IDs.
 * @param {Portal} portal - Portal instance for map transitions.
 * @param {string} currentMapKey - Key of the current map, used for state management.
 * @param {import('./eventTrigger.js').EventTrigger[]} [eventTriggers] - Optional event triggers for this map.
 * @param {Array<{name: string, spriteName?: string, x?: number, y?: number, direction?: string, dialog: string, movementPattern?: Array, movementPatternDelay?: number, blockedMoveDelay?: number}>} [npcConfigs]
 */
export class TileMap {
  constructor(
    mapData,
    solidTileIds,
    scaledTileSize,
    tileScaling,
    tileSheets,
    defaultTileSheetName,
    portal,
    currentMapKey,
    eventTriggers = [],
    npcConfigs = [],
  ) {
    this.scaledTileSize = scaledTileSize;
    this.tileScaling = tileScaling;
    this.cellTileSize = scaledTileSize / tileScaling;
    this.tileSheets = tileSheets;
    this.defaultTileSheetName = defaultTileSheetName || Object.keys(tileSheets)[0];
    this.portal = portal;
    this.currentMapKey = currentMapKey;
    this.eventTriggers = eventTriggers;
    this._npcConfigs = npcConfigs;
    this.npcs = [];

    if (!this.tileSheets[this.defaultTileSheetName]) {
      throw new Error(`Default tilesheet "${this.defaultTileSheetName}" is not defined.`);
    }

    this._resolvedSheets = {};
    for (const [name, sheet] of Object.entries(this.tileSheets)) {
      this._resolvedSheets[name] = {
        ...sheet,
        tilesPerSheetRow: sheet.tilesPerSheetRow || Math.floor(sheet.width / sheet.tileSize),
      };
    }

    this.mapData = this.normalizeMapData(mapData);
    this.rows = this.mapData.length;
    this.cols = this.mapData[0]?.length || 0;
    this.solidTileIds = this.normalizeSolidTileIds(solidTileIds);

    // Pre-bake the entire static map into a single off-screen surface.
    // On every draw() call we then do one drawImage instead of rows*cols
    // drawImage calls + context save/scale/restore per tile.
    this._bakedMap = this._bakeMap();
  }

  /**
   * Instantiate map NPCs bound to the provided game instance.
   * @param {import('./game.js').Game} game
   * @returns {void}
   */
  attachNpcsToGame(game) {
    this.npcs = this._npcConfigs.map((config) => new Npc(game, config));
  }

  /**
   * Update all map NPCs.
   * @param {number} deltaTime
   * @param {number} fps
   * @returns {void}
   */
  update(deltaTime, fps) {
    this.npcs.forEach((npc) => npc.update([], deltaTime, fps));
  }

  /**
   * Get the first facing interaction target (NPC first, then event trigger).
   * @param {import('./player.js').Player} player
   * @returns {Npc | import('./eventTrigger.js').EventTrigger | null}
   */
  getInteractionTarget(player) {
    const npc = this.npcs.find((candidate) => candidate.isFacing(player));
    if (npc) return npc;

    return this.eventTriggers.find((trigger) => trigger.isFacing(player)) ?? null;
  }

  /**
   * Returns an event trigger located at the given world-space tile coordinate.
   * @param {number} x
   * @param {number} y
   * @returns {import('./eventTrigger.js').EventTrigger | null}
   */
  getEventTriggerAt(x, y) {
    return this.eventTriggers.find((trigger) => trigger.hasPosition(x, y)) ?? null;
  }

  /**
   * Returns an NPC occupying the given world-space tile coordinate.
   * Moving NPCs reserve their target tile while in transit.
   * @param {number} x
   * @param {number} y
   * @returns {Npc | null}
   */
  getNpcAt(x, y) {
    return this.npcs.find((npc) => npc._occupiesTile(x, y)) ?? null;
  }

  /**
   * Legacy helper kept for compatibility with the old string format.
   * @param {string} sheetName
   * @param {number} tileIndex
   * @returns {string}
   */
  static buildTileReference(sheetName, tileIndex) {
    return `${sheetName}-${tileIndex}`;
  }

  /**
   * Preferred helper for object-based tile references.
   * @param {string} sheetName
   * @param {number} tileIndex
   * @returns {TileReference}
   */
  static createTileReference(sheetName, tileIndex) {
    return createTileReference(sheetName, tileIndex);
  }

  /**
   * Resolve and return a tilesheet config by name.
   * @param {string} sheetName
   * @returns {{
   *   image: HTMLImageElement,
   *   width: number,
   *   height: number,
   *   tileSize: number,
   *   tilesPerSheetRow: number
   * }}
   */
  getTileSheetConfig(sheetName) {
    const sheet = this._resolvedSheets[sheetName];
    if (!sheet) {
      throw new Error(`Tilesheet "${sheetName}" is not registered.`);
    }
    return sheet;
  }

  /**
   * Build normalized key for a resolved tile entry.
   * @param {string} sheetName
   * @param {number} tileIndex
   * @returns {string}
   */
  getTileKey(sheetName, tileIndex) {
    return `${sheetName}:${tileIndex}`;
  }

  /**
   * Parse a tile reference in number/object/string form.
   * @param {number | string | TileReference} tileReference
   * @returns {{ sheetName: string, tileIndex: number }}
   */
  parseTileReference(tileReference) {
    if (typeof tileReference === 'number') {
      return {
        sheetName: this.defaultTileSheetName,
        tileIndex: tileReference,
      };
    }

    if (
      tileReference &&
      typeof tileReference === 'object' &&
      typeof tileReference.sheetName === 'string' &&
      Number.isFinite(tileReference.tileIndex)
    ) {
      return tileReference;
    }

    // Use lastIndexOf so sheet names containing dashes (e.g. "my-sheet") work correctly.
    const separatorIndex = tileReference.lastIndexOf('-');
    if (separatorIndex === -1) {
      throw new Error(`Invalid tile reference "${tileReference}". Use "sheetName-tileIndex".`);
    }

    const sheetName = tileReference.slice(0, separatorIndex);
    const tileIndex = Number(tileReference.slice(separatorIndex + 1));

    if (!Number.isFinite(tileIndex)) {
      throw new Error(
        `Invalid tile index in reference "${tileReference}". Expected a number after '-'.`,
      );
    }

    return { sheetName, tileIndex };
  }

  /**
   * Resolve a tile reference into render-ready tile metadata.
   * @param {number | string | TileReference} tileReference
   * @returns {{
   *   key: string,
   *   sheetName: string,
   *   tileSheet: {
   *     image: HTMLImageElement,
   *     width: number,
   *     height: number,
   *     tileSize: number,
   *     tilesPerSheetRow: number
   *   },
   *   tileIndex: number,
   *   srcX: number,
   *   srcY: number
   * }}
   */
  resolveTile(tileReference) {
    const { sheetName, tileIndex } = this.parseTileReference(tileReference);
    const tileSheet = this.getTileSheetConfig(sheetName);
    const srcX = (tileIndex % tileSheet.tilesPerSheetRow) * tileSheet.tileSize;
    const srcY = Math.floor(tileIndex / tileSheet.tilesPerSheetRow) * tileSheet.tileSize;

    return {
      key: this.getTileKey(sheetName, tileIndex),
      sheetName,
      tileSheet,
      tileIndex,
      srcX,
      srcY,
    };
  }

  /**
   * Resolve every tile reference in map data.
   * @param {Array<Array<number | string | TileReference>>} mapData
   * @returns {Array<Array<ReturnType<TileMap['resolveTile']>>>}
   */
  normalizeMapData(mapData) {
    return mapData.map((row) => row.map((tileReference) => this.resolveTile(tileReference)));
  }

  /**
   * Normalize solid tile references into key set form.
   * @param {Set<number | string | TileReference> | Record<string, Set<number | string | TileReference>>} solidTileIds
   * @returns {Set<string>}
   */
  normalizeSolidTileIds(solidTileIds) {
    const resolvedSolidTileIds = new Set();

    if (!(solidTileIds instanceof Set)) {
      for (const [sheetName, tileIds] of Object.entries(solidTileIds)) {
        for (const tileReference of tileIds) {
          if (typeof tileReference === 'number') {
            resolvedSolidTileIds.add(this.resolveTile({ sheetName, tileIndex: tileReference }).key);
            continue;
          }

          resolvedSolidTileIds.add(this.resolveTile(tileReference).key);
        }
      }

      return resolvedSolidTileIds;
    }

    for (const tileReference of solidTileIds) {
      resolvedSolidTileIds.add(this.resolveTile(tileReference).key);
    }

    return resolvedSolidTileIds;
  }

  // Returns true if the world-space bounding box overlaps any solid tile.
  // worldX/worldY is the top-left corner; width/height is the bounding box size.
  /**
   * Check whether a world-space rectangle overlaps any solid tile.
   * @param {number} worldX
   * @param {number} worldY
   * @param {number} width
   * @param {number} height
   * @returns {boolean}
   */
  isSolid(worldX, worldY, width, height) {
    const tileLeft = Math.floor(worldX / this.scaledTileSize);
    const tileTop = Math.floor(worldY / this.scaledTileSize);
    const tileRight = Math.floor((worldX + width - 1) / this.scaledTileSize);
    const tileBottom = Math.floor((worldY + height - 1) / this.scaledTileSize);

    for (let r = tileTop; r <= tileBottom; r++) {
      for (let c = tileLeft; c <= tileRight; c++) {
        // Treat out-of-bounds as solid
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return true;
        if (this.solidTileIds.has(this.mapData[r][c].key)) return true;
      }
    }
    return false;
  }

  /**
   * Render every tile once into an off-screen canvas so draw() can use a
   * single drawImage() instead of iterating all tiles each frame.
   * @returns {OffscreenCanvas|HTMLCanvasElement}
   */
  _bakeMap() {
    const w = this.cols * this.scaledTileSize;
    const h = this.rows * this.scaledTileSize;

    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement('canvas'), {
            width: w,
            height: h,
          });

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.mapData[r][c];
        ctx.drawImage(
          tile.tileSheet.image,
          tile.srcX,
          tile.srcY,
          tile.tileSheet.tileSize,
          tile.tileSheet.tileSize,
          c * this.scaledTileSize,
          r * this.scaledTileSize,
          this.scaledTileSize,
          this.scaledTileSize,
        );
      }
    }

    return canvas;
  }

  /**
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX - World X of the top-left corner of the viewport
   * @param {number} cameraY - World Y of the top-left corner of the viewport
   */
  draw(context, cameraX = 0, cameraY = 0) {
    context.drawImage(this._bakedMap, -cameraX, -cameraY);

    this.npcs
      .slice()
      .sort((left, right) => left.y - right.y)
      .forEach((npc) => npc.draw(context));
  }
}
