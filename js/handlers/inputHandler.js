const ALLOWED_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
];

export class InputHandler {
  constructor() {
    this.keys = [];
    window.addEventListener('keydown', (e) => {
      if (ALLOWED_KEYS.includes(e.key) && this.keys.indexOf(e.key) === -1) {
        this.keys.push(e.key);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (ALLOWED_KEYS.includes(e.key) && this.keys.indexOf(e.key) > -1) {
        this.keys.splice(this.keys.indexOf(e.key), 1);
      }
    });
  }
}
