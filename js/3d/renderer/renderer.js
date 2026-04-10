import { WebGLRenderer, ACESFilmicToneMapping } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { scene } from '../scene.js';
import { camera } from '../camera/camera.js';

export class RendererContext {
  _renderer = null;
  _composer = null;

  constructor({ canvas }) {
    this._renderer = new WebGLRenderer({
      canvas,
      antialias: true,
    });

    this._renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this._renderer.toneMapping = ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1;

    this._composer = new EffectComposer(this._renderer);
    this._composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass();
    bloom.threshold = 0.85;
    bloom.strength = 0.01; // glow intensity
    bloom.radius = 2; // glow spread
    this._composer.addPass(bloom);
    this._composer.addPass(new OutputPass());
  }

  get renderer() {
    return this._renderer;
  }

  get composer() {
    return this._composer;
  }
}

export const rendererContext = new RendererContext({ canvas: renderCanvas });
export const renderer = rendererContext.renderer;
export const composer = rendererContext.composer;
