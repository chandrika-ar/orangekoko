import * as THREE from "three";

/**
 * Procedural plank-floor and panelled-wall textures — the room's flat
 * MeshStandardMaterial colors alone read as a handful of disconnected solid
 * blocks (a clip-art look) rather than a real wood-panelled shop. These add
 * grain and seams without a new image asset, tiled via RepeatWrapping so
 * they hold up over however long the corridor gets.
 */
export function makeWoodFloorTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;

  ctx.fillStyle = "#241a12";
  ctx.fillRect(0, 0, size, size);

  const plankWidth = 64;
  for (let x = 0; x < size; x += plankWidth) {
    for (let i = 0; i < 5; i++) {
      const gx = x + 8 + Math.random() * (plankWidth - 16);
      ctx.strokeStyle = `rgba(120,84,54,${0.06 + Math.random() * 0.07})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      let cy = 0;
      ctx.moveTo(gx, cy);
      while (cy < size) {
        cy += 24 + Math.random() * 36;
        ctx.lineTo(gx + (Math.random() - 0.5) * 5, Math.min(cy, size));
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeWallPanelTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;

  const railY = size * 0.6;
  ctx.fillStyle = "#5a4130";
  ctx.fillRect(0, 0, size, railY);
  ctx.fillStyle = "#2e2117";
  ctx.fillRect(0, railY, size, size - railY);

  ctx.strokeStyle = "#8a6a45";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, railY);
  ctx.lineTo(size, railY);
  ctx.stroke();

  const panelWidth = size / 4;
  for (let x = panelWidth; x < size; x += panelWidth) {
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A soft warm radial glow — used for the light spilling through the
 * doorway as it opens. A point light alone has no visible shape without
 * post-processing bloom this scene doesn't have; this gives it one. */
export function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,241,214,1)");
  gradient.addColorStop(0.35, "rgba(255,205,140,0.75)");
  gradient.addColorStop(1, "rgba(255,205,140,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
