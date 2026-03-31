import {
  PointsMaterial,
  BufferAttribute,
  Points,
  BufferGeometry,
  // AdditiveBlending
} from 'three';

const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);
const particlesGeometry = new BufferGeometry();

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
  positions[i * 3 + 2] = Math.random() * -5;
}
particlesGeometry.setAttribute('position', new BufferAttribute(positions, 3));
const particlesMaterial = new PointsMaterial({
  color: 0xffeded,
  sizeAttenuation: true,
  size: 0.01,
  //   depthWrite: false,
  //   blending: AdditiveBlending,
});

export const particles = new Points(particlesGeometry, particlesMaterial);
