import { CanvasTexture, NearestFilter } from 'three';
export const canvasTexture = new CanvasTexture(mainCanvas);

canvasTexture.minFilter = NearestFilter;
canvasTexture.magFilter = NearestFilter;
