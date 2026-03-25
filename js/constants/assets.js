// Resolves the assets/ folder relative to THIS file (js/constants/assets.js),
// producing a fully absolute URL that works on any deployment path.
export const ASSETS_BASE = new URL('../../assets/', import.meta.url).href;
