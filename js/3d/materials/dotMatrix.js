import { ShaderMaterial, Vector2 } from 'three';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../constants/game.js';

export const dotMatrixMaterialBuilder = (texture) => {
  const dotMatrixMaterial = new ShaderMaterial({
    uniforms: {
      map: { value: texture },
      // resolution: { value: new Vector2(160, 144) }, // GBC native resolution
      resolution: {
        value: new Vector2(CANVAS_WIDTH, CANVAS_HEIGHT),
      }, // GBC native resolution
      gapSize: { value: 0.1 }, // fraction of a cell used for the border (0.03–0.1)
      gapBrightness: { value: 0.2 }, // gap colour as a fraction of pixel brightness
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform vec2 resolution;
        uniform float gapSize;
        uniform float gapBrightness;
        varying vec2 vUv;
  
        void main() {
          vec2 cell = vUv * resolution;
          vec2 cellIndex = floor(cell);
          vec2 cellPos = fract(cell); // 0→1 within each pixel cell
  
          // How many screen pixels does one cell span?
          // When < ~2px the grid becomes sub-pixel noise — fade it out.
          vec2 cellSizePx = vec2(dFdx(cell.x), dFdy(cell.y));
          float cellPx = max(abs(cellSizePx.x), abs(cellSizePx.y)); // reciprocal = px per cell
          // gridStrength → 1 when cell is ≥ 4 screen-px wide, 0 when ≤ 1.5 px wide
          float gridStrength = smoothstep(1.5, 4.0, 1.0 / cellPx);
  
          // Sample the colour at the centre of this pixel cell
          vec2 sampleUv = (cellIndex + 0.5) / resolution;
          vec4 col = texture2D(map, sampleUv);
  
          // Square pixel mask with anti-aliased edges.
          // Only computed when the grid is actually visible (avoids Moiré when zoomed out).
          float hw = gapSize * 0.5;
          float ex = fwidth(cellPos.x);
          float ey = fwidth(cellPos.y);
          float maskX = smoothstep(hw - ex, hw + ex, cellPos.x) *
                        smoothstep(hw - ex, hw + ex, 1.0 - cellPos.x);
          float maskY = smoothstep(hw - ey, hw + ey, cellPos.y) *
                        smoothstep(hw - ey, hw + ey, 1.0 - cellPos.y);
          float mask = mix(1.0, maskX * maskY, gridStrength);
  
          // Border shows a very dark tint of the pixel colour (LCD bleed)
          col.rgb = mix(col.rgb * gapBrightness, col.rgb, mask);
  
          // Subtle vignette at screen edges
          vec2 vig = vUv * (1.0 - vUv.yx);
          col.rgb *= pow(clamp(vig.x * vig.y * 15.0, 0.0, 1.0), 0.18);
  
          gl_FragColor = col;
        }
      `,
  });
  return dotMatrixMaterial;
};
