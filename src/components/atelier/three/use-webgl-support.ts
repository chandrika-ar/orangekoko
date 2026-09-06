"use client";

import { useState } from "react";

export interface DeviceSupport {
  webgl: boolean;
  reducedMotion: boolean;
}

// This hook only ever mounts client-side (the whole journey is loaded via
// next/dynamic with ssr: false), so window/document are already available
// on the very first render — no effect needed to read them.
function computeSupport(): DeviceSupport {
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    webgl = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return { webgl, reducedMotion };
}

export function useWebglSupport(): DeviceSupport {
  const [support] = useState(computeSupport);
  return support;
}
