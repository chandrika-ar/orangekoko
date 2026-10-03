"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useState, type ReactNode } from "react";
import * as THREE from "three";

export function CanvasStage({ children }: { children: ReactNode }) {
  // A lost WebGL context (GPU driver reset, backgrounded mobile tab, etc.)
  // otherwise leaves the canvas permanently blank — three.js's own renderer
  // doesn't rebuild the app's scene state on its own. Remounting the whole
  // <Canvas> once the browser restores the context is the reliable fix.
  const [canvasKey, setCanvasKey] = useState(0);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    const canvas = gl.domElement;
    const onContextLost = (event: Event) => event.preventDefault();
    const onContextRestored = () => setCanvasKey((k) => k + 1);
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);
  }, []);

  return (
    <Canvas
      key={canvasKey}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={handleCreated}
      camera={{ fov: 48, near: 0.1, far: 60, position: [0, 2.2, 9] }}
    >
      {children}
    </Canvas>
  );
}
