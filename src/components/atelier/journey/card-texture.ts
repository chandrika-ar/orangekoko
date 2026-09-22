import * as THREE from "three";
import type { JourneyItem } from "./types";

const CARD_WIDTH = 320;
const CARD_HEIGHT = 432; // matches the card plane's 1.15:1.55 aspect in scene.tsx
const PHOTO_BOX = { x: 24, y: 24, w: CARD_WIDTH - 48, h: 232 };

/**
 * Draws a card's face onto an offscreen canvas and returns it as a texture.
 *
 * Deliberately not @react-three/drei's <Text>: it fetches its default font
 * from a remote CDN at runtime, which is one more thing that can fail on a
 * flaky connection. This reuses whatever font is already loaded on the page
 * (see displayFont/sansFont, read from computed styles in atelier-journey.tsx)
 * so there's no extra network request at all.
 *
 * The product photo (when the catalogue has one) loads asynchronously and
 * redraws the same canvas in place once it arrives — the card starts out
 * showing the plain placeholder immediately rather than blocking on the
 * network, then swaps to the real photo, `texture.needsUpdate = true`
 * telling three.js to re-upload it on the next frame it renders anyway.
 */
export function makeCardTexture(item: JourneyItem, displayFont: string, sansFont: string) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  function drawFrame() {
    if (!ctx) return;
    ctx.fillStyle = "#efe7d8";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.strokeStyle = "#b8863f";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, CARD_WIDTH - 16, CARD_HEIGHT - 16);
  }

  function drawPlaceholderPhoto() {
    if (!ctx) return;
    ctx.fillStyle = "#e3d7bf";
    ctx.fillRect(PHOTO_BOX.x, PHOTO_BOX.y, PHOTO_BOX.w, PHOTO_BOX.h);
    ctx.strokeStyle = "#c9a86a";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PHOTO_BOX.x, PHOTO_BOX.y, PHOTO_BOX.w, PHOTO_BOX.h);
    ctx.fillStyle = "#c9622c";
    ctx.beginPath();
    ctx.arc(CARD_WIDTH / 2, PHOTO_BOX.y + PHOTO_BOX.h / 2, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLabels() {
    if (!ctx) return;
    ctx.textAlign = "center";
    ctx.fillStyle = "#211c17";
    ctx.font = `600 24px ${displayFont}`;
    wrapText(ctx, item.title, CARD_WIDTH / 2, PHOTO_BOX.y + PHOTO_BOX.h + 44, CARD_WIDTH - 50, 28);

    ctx.font = `500 17px ${sansFont}`;
    ctx.fillStyle = "#c9622c";
    ctx.fillText(item.priceLabel, CARD_WIDTH / 2, CARD_HEIGHT - 34);
  }

  drawFrame();
  drawPlaceholderPhoto();
  drawLabels();

  if (item.imageUrl) {
    const img = new Image();
    img.onload = () => {
      if (!ctx) return;
      drawFrame();
      drawCoverImage(ctx, img, PHOTO_BOX);
      drawLabels();
      texture.needsUpdate = true;
    };
    // A failed fetch just leaves the placeholder up — never worth surfacing
    // as an error for a decorative card in a 3D room.
    //
    // Routed through Next's own image optimizer rather than fetched from
    // cdn.sanity.io directly: drawing a cross-origin image onto a canvas
    // that's then uploaded to WebGL as a texture requires the image to have
    // loaded in actual CORS mode (img.crossOrigin = "anonymous") or the
    // canvas is "tainted" and texture upload throws — and that depends on
    // Sanity's CDN consistently sending the right CORS headers for every
    // request pattern, which isn't guaranteed. Going through /_next/image
    // instead makes this a same-origin request, sidestepping CORS entirely.
    img.src = `/_next/image?url=${encodeURIComponent(item.imageUrl)}&w=640&q=75`;
  }

  return texture;
}

/** Draws `img` into `box` cropped to fill it (like CSS `object-fit: cover`)
 * instead of stretching a non-matching aspect ratio. */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
) {
  const scale = Math.max(box.w / img.width, box.h / img.height);
  const sw = box.w / scale;
  const sh = box.h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
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
  // Manual letter-spacing: canvas has no tracking property. How wide that
  // renders depends entirely on the actual active font (a dev sandbox
  // falling back to a generic serif measures narrower than the real
  // display font a live site loads), so measure it and shrink to fit
  // rather than assuming a fixed size always clears the canvas — a fixed
  // size clipped both ends of longer labels under the real font.
  const spaced = label.toUpperCase().split("").join("  ");
  const maxTextWidth = width - 80;
  const baseSize = 40;
  ctx.font = `500 ${baseSize}px ${displayFont}`;
  const measured = ctx.measureText(spaced).width;
  const fontSize = measured > maxTextWidth ? Math.floor((baseSize * maxTextWidth) / measured) : baseSize;
  ctx.font = `500 ${fontSize}px ${displayFont}`;
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
