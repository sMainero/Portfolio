import { SoundPlayer } from './soundPlayer.js';

import { ASSETS_BASE } from '../../constants/assets.js';

const SOUNDS = {
  bump: { audio: new Audio(`${ASSETS_BASE}sounds/bump.mp3`), interval: 500 },
};

export class SfxPlayer extends SoundPlayer {
  constructor(anchorElement) {
    super(anchorElement);
    this.sounds = SOUNDS;
  }
}
