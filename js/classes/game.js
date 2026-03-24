import { InputHandler } from '../handlers/inputHandler.js';
import { Player } from './player.js';

export class Game {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.player = new Player(this);
    this.input = new InputHandler();
  }
  update() {
    this.player.update(this.input.keys);
  }
  draw(context) {
    this.player.draw(context);
  }
  animate(context) {
    context.clearRect(0, 0, this.width, this.height);
    this.update();
    this.draw(context);
    requestAnimationFrame(() => this.animate(context));
  }
}
