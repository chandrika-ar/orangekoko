// Turns a plain studio product photo (flat white/cream background) into a
// version with that background made transparent, so the overlay in the
// try-on view reads as the jewelry itself rather than a photo card stuck on
// top of the video. This is a color-key heuristic (treat near-white,
// low-saturation pixels as background, with a soft falloff band for
// anti-aliased edges rather than a jagged binary cutout) — not real image
// segmentation. It works well for the plain studio-white backgrounds this
// catalogue's photography actually uses, but isn't foolproof: a piece with
// its own bright white/silver/pearl elements can lose a little of itself
// at the edges of those areas too. A proper fix is pre-cut transparent
// product photography; this is the client-side approximation of that.
const WHITE_CUTOFF = 225;
const WHITE_FALLOFF_START = 190;
const SATURATION_CUTOFF = 18;
const SATURATION_FALLOFF = 26;

export function cutoutNearWhite(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0 || canvas.height === 0) return img.src;

  ctx.drawImage(img, 0, 0);
  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    // Cross-origin pixel read blocked for some reason — fall back to the
    // plain photo rather than fail the whole overlay.
    return img.src;
  }

  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    const brightnessT = clamp01(
      (brightness - WHITE_FALLOFF_START) / (WHITE_CUTOFF - WHITE_FALLOFF_START),
    );
    const saturationT = clamp01(
      (SATURATION_FALLOFF - saturation) / (SATURATION_FALLOFF - SATURATION_CUTOFF),
    );
    // Only treat it as background where it's both bright *and* neutral —
    // a bright but saturated pixel (a colored gemstone catching the light)
    // should stay opaque.
    const backgroundness = Math.min(brightnessT, saturationT);
    d[i + 3] = Math.round(d[i + 3] * (1 - backgroundness));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}
