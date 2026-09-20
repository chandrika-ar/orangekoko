"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import { retargetMixamoClipToVrm } from "./mixamo-vrm-retarget";

const VRM_URL = "/models/atelier-customer.vrm";
// A rigged (but unanimated) VRM avatar's own idle/walk motion — Mixamo's
// Xbot, kept only as an animation source now that the visible figure is the
// VRM avatar. Its clips get retargeted onto the VRM's skeleton below.
const MIXAMO_URL = "/models/mixamo-walk-idle.glb";

// `loader` is typed `any` here: drei's useGLTF hands us three-stdlib's
// GLTFLoader, while @pixiv/three-vrm's plugin expects `@types/three`'s
// GLTFParser — the same runtime shape from two independently-vendored type
// packages, which TS treats as structurally incompatible over a couple of
// unrelated fields. The actual `.register()` call is exactly what three-vrm
// documents for any GLTFLoader instance.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extendVrmLoader(loader: any) {
  loader.register((parser: never) => new VRMLoaderPlugin(parser));
}

/**
 * The customer figure standing in for the player: a VRM avatar (VRoid Hub —
 * license on this specific model permits commercial use, redistribution,
 * and modification, no credit required) walking on Mixamo animation data
 * retargeted onto its own humanoid skeleton, since VRM avatars ship as a
 * static pose with no baked-in animation of their own.
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
  const vrmGltf = useGLTF(VRM_URL, false, false, extendVrmLoader) as unknown as GLTF & { userData: { vrm: VRM } };
  const vrm = vrmGltf.userData.vrm;
  const mixamo = useGLTF(MIXAMO_URL);

  useEffect(() => {
    vrm.scene.traverse((child: THREE.Object3D) => {
      child.frustumCulled = false;
    });
  }, [vrm]);

  const clips = useMemo(() => {
    const idleSource = THREE.AnimationClip.findByName(mixamo.animations, "idle");
    const walkSource = THREE.AnimationClip.findByName(mixamo.animations, "walk");
    if (!idleSource || !walkSource) return [];
    return [retargetMixamoClipToVrm(idleSource, mixamo.scene, vrm), retargetMixamoClipToVrm(walkSource, mixamo.scene, vrm)];
  }, [mixamo, vrm]);

  const { actions } = useAnimations(clips, vrm.scene);
  const wasMoving = useRef(false);

  useEffect(() => {
    const idle = actions.idle;
    if (!idle) return;
    idle.reset().play();
    wasMoving.current = false;
  }, [actions]);

  useFrame((_, delta) => {
    vrm.update(delta);

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

  return <primitive ref={group} object={vrm.scene} />;
}

useGLTF.preload(VRM_URL, false, false, extendVrmLoader);
useGLTF.preload(MIXAMO_URL);
