import { ASSETS_BASE } from '../../constants/assets.js';
import { World } from './GameWorld.js';
import { scene } from './scene.js';
import * as THREE from 'three';
import { loadingManager } from '../../utils/loadingManager.js';
import { SceneObject } from './SceneObject.js';

/** @type {THREE.Texture | null} */
let _cachedTexture = null;
/** @type {Record<string, HTMLImageElement>} */
const _cachedIcons = {};

export const preloadButtonAssets = (iconPath) => {
  const promises = [];

  const onTextureProgress = loadingManager.register('buttonTexture');
  const texturePromise = new Promise((resolve) => {
    new THREE.TextureLoader().load(
      `${ASSETS_BASE}/button.png`,
      (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        _cachedTexture = texture;
        onTextureProgress?.(100);
        resolve();
      },
      (xhr) => {
        if (xhr.total > 0) onTextureProgress?.((xhr.loaded / xhr.total) * 100);
      },
    );
  });
  promises.push(texturePromise);

  if (iconPath) {
    const onIconProgress = loadingManager.register('buttonIcon');
    const iconPromise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        _cachedIcons[iconPath] = image;
        onIconProgress?.(100);
        resolve();
      };
      image.onerror = () => {
        onIconProgress?.(100);
        resolve();
      };
      image.src = iconPath;
    });
    promises.push(iconPromise);
  }

  return Promise.all(promises);
};

export class Button extends SceneObject {
  /**
   * @type {scene}
   */
  _scene = null;
  /**
   * @type {THREE.MeshBasicMaterial}
   */
  material = null;

  /**
   * @type {THREE.BoxGeometry}
   */
  geometry = null;

  /**
   * @type {THREE.Mesh}
   */
  mesh = null;

  /**
   * @type {World}
   */
  _world = null;
  /**
   * @type {THREE.Object3D | null}
   */
  label = null;

  _baseY = 1.1;
  _elapsedTime = 0;
  _isHovered = false;
  _spinAccum = 0;
  _spinStep = Math.PI / 8; // rotation per tick
  _spinInterval = 0.05; // seconds between ticks
  _labelType = 'text';
  _labelText = 'START';
  _iconPath = `${ASSETS_BASE}/icons/camera.svg`;

  constructor(world, options = {}) {
    super({
      anchor: { enabled: false, distance: 2, marginX: 0.15, marginY: 0.15 },
    });
    this._scene = scene;
    this._world = world;

    if (typeof options === 'string') {
      this._labelType = 'text';
      this._labelText = options;
    } else {
      this._labelType = options.labelType ?? 'text';
      this._labelText = options.labelText ?? 'START';
      this._iconPath = options.iconPath ?? `${ASSETS_BASE}/icons/camera.svg`;
    }

    const map =
      _cachedTexture ??
      (() => {
        const t = new THREE.TextureLoader().load(`${ASSETS_BASE}/button.png`);
        t.magFilter = THREE.LinearFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
    this.material = new THREE.MeshBasicMaterial({
      map: map,
      opacity: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2, 1, 1, 1);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0.7, 1.5, 0.1);
    this.mesh.renderOrder = 1000;
    // this._updateScreenAnchor();
    this._baseY = this.mesh.position.y;
    this._scene.add(this.mesh);
    this._world.registerMesh(this.mesh, this);
    // this.mesh.quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 1.15, 0)) ;
    // this.mesh.rotation.z = Math.PI * 1.25;
    if (this._labelType === 'icon') {
      this._buildIconLabel(this._iconPath).then((label) => {
        if (!label) return;
        this.label = label;
        this.mesh.add(label);
        this._world.registerMesh(label, this);
      });
    } else {
      this._buildTextLabel(this._labelText).then((label) => {
        if (!label) return;
        this.label = label;
        this.mesh.add(label);
        this._world.registerMesh(label, this);
      });
    }
  }

  async _buildTextLabel(labelText) {
    await document.fonts.load('bold 48px Pokemon');

    const canvas = document.createElement('canvas');
    const fontSize = 24;
    const padding = 24;

    // Measure text width with the loaded font
    const tmpCtx = canvas.getContext('2d');
    canvas.height = fontSize + padding * 2;
    tmpCtx.font = `bold ${fontSize}px Pokemon`;
    canvas.width = Math.ceil(tmpCtx.measureText(labelText).width) + padding * 2;

    // Re-apply context state after canvas resize (resize clears state)
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px Pokemon`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#111111';
    ctx.strokeText(labelText, canvas.width / 2, canvas.height / 2);
    ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      opacity: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const label = new THREE.Sprite(material);
    // Derive sprite width from canvas aspect ratio so nothing is ever cropped
    const spriteHeight = 0.16;
    const spriteWidth = spriteHeight * (canvas.width / canvas.height);
    label.scale.set(spriteWidth, spriteHeight, 1);
    label.position.set(0, 0, 0.21);
    return label;
  }

  async _buildIconLabel(iconPath) {
    const image = _cachedIcons[iconPath] ?? (await this._loadImage(iconPath));
    if (!image) return null;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);

    // Build white mask of the icon
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = size;
    maskCanvas.height = size;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;
    const drawSize = Math.floor(size * 0.62);
    const drawOffset = Math.floor((size - drawSize) / 2);
    maskCtx.drawImage(image, drawOffset, drawOffset, drawSize, drawSize);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fillRect(0, 0, size, size);

    // Stamp white outline around the icon
    const outlineRadius = 5;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const dx = Math.round(Math.cos(angle) * outlineRadius);
      const dy = Math.round(Math.sin(angle) * outlineRadius);
      ctx.drawImage(maskCanvas, dx, dy, size, size);
    }

    // Draw the original icon on top
    ctx.drawImage(image, drawOffset, drawOffset, drawSize, drawSize);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      opacity: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    // Sticker plane mounted on the front face of the button.
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), material);
    label.renderOrder = 1001;
    // Position just above the front face (box depth is 0.2, half-depth is 0.1).
    label.position.set(0, 0, 0.101);
    return label;
  }

  _loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  onHoverStart() {
    this._isHovered = true;
    document.body.style.cursor = 'pointer';
  }

  onHoverEnd() {
    this._isHovered = false;
    document.body.style.cursor = '';
  }

  hit(e) {
    window.switchCameraMode?.();
    let spins = 16;
    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        this.mesh.rotation.x += Math.PI / 8;
        // this.mesh.rotation.y += Math.PI / 8;
      }, i * 50);
    }
  }
  resolveKey() {
    return;
  }
  onFrame(deltaSeconds) {
    this._elapsedTime += deltaSeconds;
    super.onFrame(deltaSeconds);
    if (this._isHovered) {
      this.mesh.position.y =
        this._baseY + Math.sin(this._elapsedTime * 4) * deltaSeconds * 2;
    } else {
      if (this.mesh.position.y !== this._baseY) {
        this.mesh.position.y +=
          (this._baseY - this.mesh.position.y) * deltaSeconds * 10;
      }
    }
    // this.mesh.position.y = this._baseY + Math.sin(this._elapsedTime * 4) * 0.03;
  }
}
