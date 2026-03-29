export class State {
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

  restoreStateBackup() {
    const savedState = window.localStorage.getItem('state');

    console.log(
      '🚀 ~ state.js:35 ~ State ~ restoreStateBackup ~ savedState:',
      savedState,
    );

    if (savedState) {
      let parsedState = null;
      try {
        parsedState = JSON.parse(savedState);
      } catch (err) {
        console.error('Failed to parse saved state:', err);
      }

      console.log(
        '🚀 ~ state.js:48 ~ State ~ restoreStateBackup ~ parsedState:',
        parsedState,
      );

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

  saveStateBackup({ player, mapKey, interactions } = {}) {
    this.update({ player, mapKey, interactions });
    window.localStorage.setItem('state', JSON.stringify(this.state));
  }
}
