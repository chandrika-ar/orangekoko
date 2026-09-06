"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const MODEL_URL = "/models/atelier-customer.glb";

/**
 * The rigged customer figure standing in for the player. Sourced from
 * three.js's own MIT-licensed examples repo (Mixamo-derived; no separate
 * restrictive credits file found for this specific asset) — fine for this
 * prototype, but worth swapping for an asset with clearer commercial terms
 * before shipping for real.
 *
 * Its rest pose already stands ~1.8m tall with feet at y≈0, matching this
 * scene's convention of player.position.y staying at ground level, so no
 * extra scale/offset is needed beyond the model's own root transform.
 *
 * `movingRef` is a ref rather than a prop so the per-frame walk/idle check
 * below doesn't force React re-renders of the whole tree — same pattern as
 * the other movement state in scene.tsx.
 */
export function CustomerModel({
  movingRef,
  reduceMotion,
}: {
  movingRef: MutableRefObject<boolean>;
  reduceMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const wasMoving = useRef(false);

  useEffect(() => {
    const idle = actions.idle;
    if (!idle) return;
    idle.reset().play();
    wasMoving.current = false;
  }, [actions]);

  useFrame(() => {
    const idle = actions.idle;
    const walk = actions.walk;
    if (!idle || !walk) return;
    const moving = !reduceMotion && movingRef.current;
    if (moving !== wasMoving.current) {
      wasMoving.current = moving;
      const from = moving ? idle : walk;
      const to = moving ? walk : idle;
      to.reset().fadeIn(0.25).play();
      from.fadeOut(0.25);
    }
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload(MODEL_URL);
