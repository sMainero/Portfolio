/** @import { Player } from './player.js' */
/** @import { Game } from './game.js' */

export class Portal {
  /**
   *
   * @param {PortalEntry[]} portals
   * @typedef  {{ x:number, y:number, targetMap:string, targetX:number, targetY:number }} PortalEntry
   */
  constructor(portals) {
    /**
     * @type {PortalEntry[]}
     */

    this.portals = {};
    portals.forEach((portal) => {
      this.portals[`${portal.x},${portal.y}`] = portal;
    });
  }

  /**
   * @param {Player} player
   * @param {Game} game
   * @returns {void}
   */
  detectMove(player, game) {
    const portal = this.portals[`${player.x},${player.y}`];

    if (portal) {
      game.startMapTransition(portal.targetMap, portal.targetX, portal.targetY);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {PortalEntry | null}
   */
  getPortalAt(x, y) {
    return this.portals[`${x},${y}`] ?? null;
  }

  /**
   * Activates a portal directly by world position.
   * @param {number} x
   * @param {number} y
   * @param {Game} game
   * @returns {boolean}
   */
  activateAt(x, y, game) {
    const portal = this.getPortalAt(x, y);
    if (!portal) return false;

    game.startMapTransition(portal.targetMap, portal.targetX, portal.targetY);
    return true;
  }

  /**
   * Public helper — starts a map transition programmatically (e.g. from a yes/no action).
   * @param {string} mapKey
   * @param {number} targetX
   * @param {number} targetY
   * @param {Game} game
   * @returns {void}
   */
  startTransitionTo(mapKey, targetX, targetY, game) {
    game.startMapTransition(mapKey, targetX, targetY);
  }
}
