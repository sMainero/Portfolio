import {
  PointsMaterial,
  BufferAttribute,
  Points,
  BufferGeometry,
  AdditiveBlending,
  DynamicDrawUsage,
} from 'three';

const PARTICLE_COUNT = 200;
const TRAIL_LENGTH = 6;
const TOTAL_POINTS = PARTICLE_COUNT * TRAIL_LENGTH;
const TRAIL_STRENGTH = 1.0;

// Fixed particle positions in world space
const _basePos = new Float32Array(PARTICLE_COUNT * 3);

// Circular history of camera positions: TRAIL_LENGTH slots × vec3
const _cameraHistory = new Float32Array(TRAIL_LENGTH * 3);
let _histHead = 0; // index of the most-recently-written slot
let _isCameraHistoryInitialized = false;

// Flat output buffer fed to the GPU: step 0 = oldest/dim, step TRAIL_LENGTH-1 = newest/bright
const _trailPos = new Float32Array(TOTAL_POINTS * 3);
const _trailColor = new Float32Array(TOTAL_POINTS * 3);

// Base color #ffeded → (1.0, 0.929, 0.929)
const BASE_R = 1.0;
const BASE_G = 0.929;
const BASE_B = 0.929;

// Initialize particles once and keep them fixed in place.
for (let i = 0; i < PARTICLE_COUNT; i++) {
  _basePos[i * 3] = (Math.random() - 0.5) * 8;
  _basePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
  _basePos[i * 3 + 2] = Math.random() * -5;
}

// Static vertex colours: older steps are dimmer, newest is full brightness
for (let t = 0; t < TRAIL_LENGTH; t++) {
  const alpha = (t + 1) / TRAIL_LENGTH;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = (t * PARTICLE_COUNT + i) * 3;
    _trailColor[idx] = BASE_R * alpha;
    _trailColor[idx + 1] = BASE_G * alpha;
    _trailColor[idx + 2] = BASE_B * alpha;
  }
}

// Build single geometry for all trail points
const _geometry = new BufferGeometry();
const _posAttr = new BufferAttribute(_trailPos, 3);
_posAttr.usage = DynamicDrawUsage;
_geometry.setAttribute('position', _posAttr);
_geometry.setAttribute('color', new BufferAttribute(_trailColor, 3));

const _material = new PointsMaterial({
  vertexColors: true,
  sizeAttenuation: true,
  size: 0.02,
  depthWrite: false,
  blending: AdditiveBlending,
  transparent: true,
});

export const particles = new Points(_geometry, _material);

/**
 * Keep particles anchored in world-space and only render a trail based on
 * camera movement history so ghosting appears when the camera moves.
 *
 * @param {typeof import('../../camera/camera.js').camera.position} cameraPosition
 */
export function updateParticles(cameraPosition) {
  if (!_isCameraHistoryInitialized) {
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const idx = i * 3;
      _cameraHistory[idx] = cameraPosition.x;
      _cameraHistory[idx + 1] = cameraPosition.y;
      _cameraHistory[idx + 2] = cameraPosition.z;
    }
    _isCameraHistoryInitialized = true;
  }

  _histHead = (_histHead + 1) % TRAIL_LENGTH;
  const headIdx = _histHead * 3;
  _cameraHistory[headIdx] = cameraPosition.x;
  _cameraHistory[headIdx + 1] = cameraPosition.y;
  _cameraHistory[headIdx + 2] = cameraPosition.z;

  const currentX = _cameraHistory[headIdx];
  const currentY = _cameraHistory[headIdx + 1];
  const currentZ = _cameraHistory[headIdx + 2];

  // Unroll history into the output buffer oldest-first:
  // step 0 is the oldest (dimmest), step N-1 is the newest (brightest).
  for (let t = 0; t < TRAIL_LENGTH; t++) {
    const histIdx = (_histHead - (TRAIL_LENGTH - 1 - t) + TRAIL_LENGTH) % TRAIL_LENGTH;
    const cameraIdx = histIdx * 3;
    const offsetX = (currentX - _cameraHistory[cameraIdx]) * TRAIL_STRENGTH;
    const offsetY = (currentY - _cameraHistory[cameraIdx + 1]) * TRAIL_STRENGTH;
    const offsetZ = (currentZ - _cameraHistory[cameraIdx + 2]) * TRAIL_STRENGTH;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dst = (t * PARTICLE_COUNT + i) * 3;
      const src = i * 3;
      _trailPos[dst] = _basePos[src] + offsetX;
      _trailPos[dst + 1] = _basePos[src + 1] + offsetY;
      _trailPos[dst + 2] = _basePos[src + 2] + offsetZ;
    }
  }

  _posAttr.needsUpdate = true;
}
