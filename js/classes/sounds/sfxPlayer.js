import { SoundPlayer } from './soundPlayer.js';
import { ASSETS_BASE } from '../../constants/assets.js';

const SOUNDS_PATH = `${ASSETS_BASE}sounds`;

const SOUND_DEFS = [
  { name: 'bump', url: `${SOUNDS_PATH}/Bump.wav`, interval: 500 },
  { name: 'confirm', url: `${SOUNDS_PATH}/Confirm.wav`, interval: 0 },
  { name: 'cancel', url: `${SOUNDS_PATH}/Cancel.wav`, interval: 0 },
  { name: 'menuMove', url: `${SOUNDS_PATH}/MenuMove.wav`, interval: 0 },
  { name: 'on', url: `${SOUNDS_PATH}/On.wav`, interval: 100 },
];

export class SfxPlayer extends SoundPlayer {
  constructor() {
    super();
    for (const { name, url, interval } of SOUND_DEFS) {
      this.loadSound(name, url, interval);
    }
  }

  mute() {
    this.muted = true;
  }

  unmute() {
    this.muted = false;
  }

  get isMuted() {
    return this.muted;
  }
}

export const sfxPlayer = new SfxPlayer();
