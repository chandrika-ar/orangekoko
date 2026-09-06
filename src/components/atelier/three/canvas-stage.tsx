"use client";

import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import * as THREE from "three";

export function CanvasStage({ children }: { children: ReactNode }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      camera={{ fov: 48, near: 0.1, far: 60, position: [0, 2.2, 9] }}
    >
      {children}
    </Canvas>
  );
}
