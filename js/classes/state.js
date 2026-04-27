/**
 * Persisted gameplay state snapshot and backup helpers.
 */
export class State {
  /**
   * Initialize default state values.
   */
  constructor() {
    this.player = {
      x: null,
      y: null,
      direction: 'down',
      facingX: null,
      facingY: null,
    };
    this.mapKey = null;
    this.interactions = {};
    this.stepsSinceBackup = 0;
    this.transition = null;
    this.activeEvent = null;
  }

  /**
   * @returns {{
   *   player: {
   *     x: number | null,
   *     y: number | null,
   *     direction: string,
   *     facingX: number | null,
   *     facingY: number | null
   *   },
   *   mapKey: string | null,
   *   interactions: Record<string, Record<string, { interacted: boolean }>>
   * }}
   */
  get state() {
    return {
      player: {
        x: this.player.x,
        y: this.player.y,
        direction: this.player.direction,
        facingX: this.player.facingX,
        facingY: this.player.facingY,
      },
      mapKey: this.mapKey,
      interactions: this.interactions,
    };
  }

  /**
   * Restore state from localStorage if present.
   * @returns {{
   *   player: {
   *     x: number | null,
   *     y: number | null,
   *     direction: string,
   *     facingX: number | null,
   *     facingY: number | null
   *   },
   *   mapKey: string | null,
   *   interactions: Record<string, Record<string, { interacted: boolean }>>
   * }}
   */
  restoreStateBackup() {
    const savedState = window.localStorage.getItem('state');

    if (savedState) {
      let parsedState = null;
      try {
        parsedState = JSON.parse(savedState);
      } catch (err) {
        console.error('Failed to parse saved state:', err);
      }

      this.player.x = parsedState?.player?.x ?? null;
      this.player.y = parsedState?.player?.y ?? null;
      this.player.direction = parsedState?.player?.direction ?? 'down';
      this.player.facingX = parsedState?.player?.facingX ?? null;
      this.player.facingY = parsedState?.player?.facingY ?? null;
      this.mapKey = parsedState?.mapKey ?? null;
      this.interactions = parsedState?.interactions ?? {};
    }
    return this.state;
  }

  /**
   * Merges a partial state object into the current state and resets stepsSinceBackup.
   * @param {{ player?: { x: number, y: number }, mapKey?: string, interactions?: object }} partial
   */
  update({ player, mapKey, interactions } = {}) {
    this.stepsSinceBackup = 0;
    if (player) {
      this.player.x = player.x;
      this.player.y = player.y;
      this.player.direction = player.direction;
      this.player.facingX = player.facingX;
      this.player.facingY = player.facingY;
    }
    if (mapKey) {
      this.mapKey = mapKey;
    }
    if (interactions) {
      for (const [map, events] of Object.entries(interactions)) {
        this.interactions[map] = { ...this.interactions[map], ...events };
      }
    }
  }

  /**
   * Merge and persist current state into localStorage.
   * @param {{
   *   player?: {
   *     x: number,
   *     y: number,
   *     direction: string,
   *     facingX: number,
   *     facingY: number
   *   },
   *   mapKey?: string,
   *   interactions?: Record<string, Record<string, { interacted: boolean }>>
   * }} [params]
   * @returns {void}
   */
  saveStateBackup({ player, mapKey, interactions } = {}) {
    this.update({ player, mapKey, interactions });
    window.localStorage.setItem('state', JSON.stringify(this.state));
  }
}
