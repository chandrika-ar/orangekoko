import * as THREE from "three";
import type { JourneyItem } from "./types";

/**
 * Draws a card's face onto an offscreen canvas and returns it as a texture.
 *
 * Deliberately not @react-three/drei's <Text>: it fetches its default font
 * from a remote CDN at runtime, which is one more thing that can fail on a
 * flaky connection. This reuses whatever font is already loaded on the page
 * (see displayFont/sansFont, read from computed styles in atelier-journey.tsx)
 * so there's no extra network request at all.
 */
export function makeCardTexture(item: JourneyItem, displayFont: string, sansFont: string) {
  const width = 320;
  const height = 320;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#efe7d8";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#b8863f";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  ctx.fillStyle = "#c9622c";
  ctx.beginPath();
  ctx.arc(width / 2, 110, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#211c17";
  ctx.font = `600 24px ${displayFont}`;
  wrapText(ctx, item.title, width / 2, 200, width - 50, 28);

  ctx.font = `500 17px ${sansFont}`;
  ctx.fillStyle = "#c9622c";
  ctx.fillText(item.priceLabel, width / 2, 260);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A wide category signpost, e.g. "PIERCED EARRINGS", drawn the same way as
 * the cards — no font fetch, reuses the page's own computed font. */
export function makeSignTexture(label: string, displayFont: string) {
  const width = 512;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#211c17";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#b8863f";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f6f1e9";
  ctx.font = `500 40px ${displayFont}`;
  // Manual letter-spacing: canvas has no tracking property.
  const spaced = label.toUpperCase().split("").join("  ");
  ctx.fillText(spaced, width / 2, height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
