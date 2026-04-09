/**
 * @typedef {{ sheetName: string, tileIndex: number }} TileReference
 */

/**
 * @param {string} sheetName
 * @param {number} tileIndex
 * @returns {TileReference}
 */
export const createTileReference = (sheetName, tileIndex) => ({
  sheetName,
  tileIndex,
});

/**
 * Creates a builder bound to a tileset name.
 * @param {string} sheetName
 * @returns {(tileIndex: number) => TileReference}
 */
export const createTileBuilder = (sheetName) => (tileIndex) =>
  createTileReference(sheetName, tileIndex);
