"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { makeCardTexture, makeSignTexture } from "./card-texture";
import { CustomerModel } from "./customer-model";
import type { CategoryRoom } from "./get-journey-items";
import { makeGlowTexture, makeWallPanelTexture, makeWoodFloorTexture } from "./surface-texture";
import type { JourneyStage } from "./types";

// World-space offset (above the card's own origin) that the on-screen
// "nearby item" callout tracks — see the projection in the room-stage
// useFrame block below.
const CARD_ANCHOR_OFFSET = new THREE.Vector3(0, 1.05, 0);

// Layout constants. Room-length values (door/entrance position, floor and
// wall spans) are derived from these plus the number of category rooms —
// see the `layout` memo below — since a 500-SKU catalogue means the corridor
// can be one room long or several, depending on how many categories have
// stock right now.
const RADIUS_CAT = 2.8; // radius of each category's display ring
const ROOM_PITCH = RADIUS_CAT * 2 + 3; // distance between consecutive room centers
const CARD_Y = 1.95;
const DOOR_W = 1.1;
const DOOR_H = 2.2;
const ROOM_HALF_W = 4.6;
const PLAYER_CLAMP_X = ROOM_HALF_W - 0.5;
const SELECT_RADIUS = 2.1;
const COUNTER_RADIUS = RADIUS_CAT * 0.62; // matches the counter cylinder's top radius below
// Bigger than the card ring's own radius, not smaller — the player walks
// in from *outside* the ring (from the entrance, moving toward the
// counter), so stopping her at a radius smaller than RADIUS_CAT means she
// has already walked past the card and in behind it before the collision
// catches her, however small the margin. Stopping outside RADIUS_CAT
// instead means she meets the card on the way in, before reaching it —
// the card ends up just ahead of her, not behind her or overlapping her.
const COUNTER_COLLISION_RADIUS = RADIUS_CAT + 0.35;
const MOVE_SPEED = 3.3;
const AUTO_WALK_SPEED = 5; // brisker than manual walking for the "try this piece on" walk to the door
const MAX_CLICK_MOVE = 6; // cap on how far a single floor click can send the player
const DOOR_DURATION = 1.6;

// A deep-brown antique-shop palette: wood and brass carry almost every
// surface, so the room reads as one material story instead of a scatter of
// unrelated solid-color blocks. Cream stays reserved for the parchment
// cards and signage, where the contrast against the dark room is the point
// — everything else lives in the wood/brass family, varying in value
// (light/dark) rather than hue.
const COLORS = {
  cream: "#e8d9bd",
  creamDeep: "#dcc9a3",
  ink: "#140f0a",
  inkSoft: "#2a1f16",
  accent: "#c9622c",
  accentSoft: "#e2a262",
  brass: "#a9793f",
  wood: "#3a2a1d",
  woodDeep: "#241a12",
  woodLight: "#5a4130",
};

// A little curio-shop clutter — glass jars, a paper lantern, a dried flower
// bunch — echoing the warm, cluttered antique-shop reference photos, rather
// than the bare pedestal-and-glow-orb this corridor started with. The jars
// vary in value within the same amber-glass family rather than cycling
// through unrelated hues, so they read as "a shelf of old jars" rather than
// a row of crayons.
const JAR_GLASS_TONES = ["#6b4423", "#3f2e1c", "#7a5c3a", "#523a24"];
const DRIED_FLOWER = "#a9707a";
const DRIED_FLOWER_DARK = "#7c5350";

export function Scene({
  rooms,
  stage,
  selectedIndex,
  reduceMotion,
  doorRequestToken,
  displayFont,
  sansFont,
  onSelect,
  onReachDoor,
  onDoorComplete,
  anchorRef,
}: {
  rooms: CategoryRoom[];
  stage: JourneyStage;
  selectedIndex: number | null;
  reduceMotion: boolean;
  doorRequestToken: number;
  /** Computed font-family strings read from the page's own DOM — see atelier-journey.tsx. */
  displayFont: string;
  sansFont: string;
  onSelect: (index: number | null) => void;
  onReachDoor: () => void;
  onDoorComplete: () => void;
  /** Positioned (left/top, in px) every frame to track the nearest card's
      on-screen projection — see atelier-journey.tsx, which renders the
      actual "nearby item" panel content at that position. Kept as a plain
      DOM ref rather than routing this through React state or drei's <Html>
      so it updates every frame without a re-render, using the same
      imperative-ref pattern already used for the lights/door below. */
  anchorRef: RefObject<HTMLDivElement | null>;
}) {
  const { camera, size } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const playerLightRef = useRef<THREE.PointLight>(null);
  const doorPivotRef = useRef<THREE.Group>(null);
  const doorGlowRef = useRef<THREE.PointLight>(null);
  const doorGlowSpriteRef = useRef<THREE.Mesh>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);
  const movingRef = useRef(false);

  // One room per category, strung along -Z: the first room in the array is
  // farthest from the door (nearest the entrance), the last sits just before
  // it at z=0. Each room gets its own ring, counter, and signpost.
  const layout = useMemo(() => {
    const roomCenterZ = rooms.map((_, i) => (rooms.length - 1 - i) * ROOM_PITCH);
    const doorZ = -(RADIUS_CAT + 2.6);
    const doorTriggerZ = doorZ + 1.6;
    const entranceZ = (roomCenterZ[0] ?? 0) + RADIUS_CAT + 4.2;
    const cards = rooms.flatMap((room, roomIndex) => {
      const centerZ = roomCenterZ[roomIndex];
      return room.items.map((item, i) => {
        const angle = (i / room.items.length) * Math.PI * 2;
        return {
          item,
          angle,
          centerZ,
          x: RADIUS_CAT * Math.sin(angle),
          z: centerZ + RADIUS_CAT * Math.cos(angle),
        };
      });
    });
    const signs = rooms.map((room, i) => ({
      label: room.label,
      z: roomCenterZ[i] + RADIUS_CAT + 1.7,
    }));
    return { roomCenterZ, doorZ, doorTriggerZ, entranceZ, cards, signs };
  }, [rooms]);

  const playerStart = useMemo(
    () => new THREE.Vector3(0, 0, layout.entranceZ - 1),
    [layout.entranceZ],
  );

  const cardTextures = useMemo(
    () => layout.cards.map(({ item }) => makeCardTexture(item, displayFont, sansFont)),
    [layout.cards, displayFont, sansFont],
  );
  const signTextures = useMemo(
    () => layout.signs.map(({ label }) => makeSignTexture(label, displayFont)),
    [layout.signs, displayFont],
  );
  const floorTexture = useMemo(() => makeWoodFloorTexture(), []);
  const wallTexture = useMemo(() => makeWallPanelTexture(), []);
  const glowTexture = useMemo(() => makeGlowTexture(), []);

  const keys = useRef<Record<string, boolean>>({});
  const moveTarget = useRef<{ x: number; z: number } | null>(null);
  // A click/tap target that's blocked by a collision boundary (see the
  // handleFloorClick projection below, meant to prevent exactly this) would
  // otherwise leave her stuck playing her walk animation against it
  // forever, since she's never actually getting closer to the un-clamped
  // point some other, unforeseen edge case might still leave behind — she'd
  // look "out of control" even with nothing being pressed anymore. This is
  // a last-resort backstop: if she hasn't gotten meaningfully closer to
  // wherever she's headed for half a second, just give up on that target.
  const moveTargetBestDist = useRef(Infinity);
  const moveTargetStuckSince = useRef<number | null>(null);
  function setMoveTarget(target: { x: number; z: number } | null) {
    moveTarget.current = target;
    moveTargetBestDist.current = Infinity;
    moveTargetStuckSince.current = null;
  }
  // True only for the walk kicked off by "try this piece on" — cleared the
  // moment she arrives, or the moment anything else takes over movement
  // (a manual key press, a floor/card click), so the speed boost below
  // never lingers past that one walk.
  const autoWalking = useRef(false);
  // Current speed eases toward the target (0 or MOVE_SPEED) instead of
  // snapping, and the last held direction persists through that ease-out so
  // a released key glides to a stop instead of stopping dead mid-step.
  const speed = useRef(0);
  const lastDirX = useRef(0);
  const lastDirZ = useRef(0);
  const lastSelected = useRef<number | null>(null);
  const doorStart = useRef<number | null>(null);
  const doorDone = useRef(false);
  const lastDoorToken = useRef(doorRequestToken);
  // Where the camera/player were when the door sequence started, captured
  // once per run. Kept in refs rather than on camera/player.userData —
  // `camera` comes from useThree() and the lint rules here (React Compiler)
  // don't allow mutating a value a hook returned.
  const doorCamFrom = useRef<THREE.Vector3 | null>(null);
  const doorPlayerFrom = useRef<THREE.Vector3 | null>(null);

  // keyboard input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const navKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (navKeys.includes(e.key)) e.preventDefault();
      keys.current[e.key.toLowerCase()] = true;
      const moveKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (moveKeys.includes(e.key.toLowerCase())) {
        setMoveTarget(null);
        autoWalking.current = false;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      keys.current[e.key.toLowerCase()] = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // "try this piece on" button request: walk her there herself rather than
  // cutting straight to the door animation from wherever she's standing —
  // sets an unclamped move target (unlike a floor click, which caps how far
  // one click can send her) and lets the normal per-frame movement and the
  // existing doorTriggerZ check below carry her the rest of the way.
  //
  // Targeting x=0 exactly would be a problem: every room center sits at
  // x=0 too, so a path heading dead straight at one hits its collision
  // circle with zero sideways component — direction recomputed each frame
  // still points straight at the same boundary point, forever (the
  // collision below is a hard stop now, not the old sliding correction
  // that used to break exactly this kind of symmetry). Aiming the walk a
  // little off-center avoids ever setting up that exact standoff, still
  // comfortably inside the DOOR_W-wide opening she's walking toward.
  useEffect(() => {
    if (doorRequestToken !== lastDoorToken.current) {
      lastDoorToken.current = doorRequestToken;
      if (stage === "room") {
        setMoveTarget({ x: 0.2, z: layout.doorTriggerZ - 0.3 });
        autoWalking.current = true;
      }
    }
  }, [doorRequestToken, stage, layout.doorTriggerZ]);

  // reset physical scene state whenever we return to the room stage
  useEffect(() => {
    if (stage !== "room") return;
    doorStart.current = null;
    doorDone.current = false;
    doorCamFrom.current = null;
    doorPlayerFrom.current = null;
    if (playerRef.current) playerRef.current.position.copy(playerStart);
    if (playerRef.current) playerRef.current.rotation.y = Math.PI;
    if (doorPivotRef.current) doorPivotRef.current.rotation.y = 0;
    if (doorGlowRef.current) doorGlowRef.current.intensity = 0;
    if (doorGlowSpriteRef.current) {
      doorGlowSpriteRef.current.scale.setScalar(0.001);
      (doorGlowSpriteRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    }
    setMoveTarget(null);
    autoWalking.current = false;
    speed.current = 0;
    lastDirX.current = 0;
    lastDirZ.current = 0;
    lastSelected.current = null;
    onSelect(null);
    cardRefs.current.forEach((group) => {
      group?.traverse((child) => {
        if (child instanceof THREE.Mesh && "opacity" in child.material) {
          (child.material as THREE.Material & { opacity: number }).opacity = 1;
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, playerStart]);

  function handleFloorClick(event: ThreeEvent<MouseEvent>) {
    if (stage !== "room" || !playerRef.current) return;
    event.stopPropagation();
    // Clamp how far a single click can send the player — an unclamped target
    // can land many rooms away (a click near the horizon in this perspective
    // maps to a huge world-space distance), which reads as teleporting
    // rather than walking there. Capping it means a distant click just
    // starts them walking that way; a second click carries them further.
    const player = playerRef.current.position;
    const dx = event.point.x - player.x;
    const dz = event.point.z - player.z;
    const dist = Math.hypot(dx, dz);
    const clamped = Math.min(dist, MAX_CLICK_MOVE);
    const scale = dist > 0.0001 ? clamped / dist : 0;
    let targetX = player.x + dx * scale;
    let targetZ = player.z + dz * scale;

    // A click landing inside a display ring's own collision radius was
    // never actually reachable: she'd walk into the boundary and get held
    // there every frame while still "trying" to reach the original point
    // beyond it, which never counts as arrival — so she'd just keep
    // playing her walk animation in place indefinitely, looking exactly
    // like the movement had gotten stuck on even though nothing's being
    // pressed anymore. Project the target onto the boundary itself
    // instead, the same way walking into it herself already resolves.
    layout.roomCenterZ.forEach((centerZ) => {
      const rdz = targetZ - centerZ;
      const rdist = Math.hypot(targetX, rdz);
      if (rdist > 0.0001 && rdist < COUNTER_COLLISION_RADIUS) {
        const angle = Math.atan2(targetX, rdz);
        targetX = COUNTER_COLLISION_RADIUS * Math.sin(angle);
        targetZ = centerZ + COUNTER_COLLISION_RADIUS * Math.cos(angle);
      }
    });

    setMoveTarget({ x: targetX, z: targetZ });
    autoWalking.current = false;
  }

  function handleCardClick(index: number) {
    return (event: ThreeEvent<MouseEvent>) => {
      if (stage !== "room") return;
      event.stopPropagation();
      const card = layout.cards[index];
      const dir = new THREE.Vector2(card.x, card.z - card.centerZ).normalize();
      // Same distance the walking collision itself stops her at (see
      // COUNTER_COLLISION_RADIUS) — clicking a card should land her exactly
      // where walking up to it herself would.
      const standDist = COUNTER_COLLISION_RADIUS;
      setMoveTarget({
        x: dir.x * standDist,
        z: card.centerZ + dir.y * standDist,
      });
      autoWalking.current = false;
    };
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const player = playerRef.current;
    if (!player) return;

    if (stage === "room") {
      let inputX = 0;
      let inputZ = 0;
      const k = keys.current;
      const kx = (k["arrowleft"] || k["a"] ? -1 : 0) + (k["arrowright"] || k["d"] ? 1 : 0);
      const kz = (k["arrowup"] || k["w"] ? -1 : 0) + (k["arrowdown"] || k["s"] ? 1 : 0);
      if (kx !== 0 || kz !== 0) {
        const len = Math.hypot(kx, kz) || 1;
        inputX = kx / len;
        inputZ = kz / len;
      } else if (moveTarget.current) {
        const tdx = moveTarget.current.x - player.position.x;
        const tdz = moveTarget.current.z - player.position.z;
        const dist = Math.hypot(tdx, tdz);
        if (dist > 0.12) {
          inputX = tdx / dist;
          inputZ = tdz / dist;
          // Backstop for any target a collision boundary keeps her from
          // ever actually reaching: if she hasn't gotten meaningfully
          // closer in half a second, stop pursuing it instead of walking
          // in place against it forever.
          if (dist < moveTargetBestDist.current - 0.02) {
            moveTargetBestDist.current = dist;
            moveTargetStuckSince.current = null;
          } else if (moveTargetStuckSince.current === null) {
            moveTargetStuckSince.current = t;
          } else if (t - moveTargetStuckSince.current > 0.5) {
            setMoveTarget(null);
            autoWalking.current = false;
            inputX = 0;
            inputZ = 0;
          }
        } else {
          setMoveTarget(null);
          autoWalking.current = false;
        }
      }

      const hasInput = inputX !== 0 || inputZ !== 0;
      if (hasInput) {
        lastDirX.current = inputX;
        lastDirZ.current = inputZ;
      }

      // Ease speed toward its target instead of snapping, so a step starts
      // and ends with a glide rather than a jump-cut.
      const targetSpeed = hasInput ? (autoWalking.current ? AUTO_WALK_SPEED : MOVE_SPEED) : 0;
      const accel = reduceMotion ? 1 : Math.min(dt * 7, 1);
      speed.current = THREE.MathUtils.lerp(speed.current, targetSpeed, accel);

      const moving = speed.current > 0.02;
      movingRef.current = moving;
      if (moving) {
        player.position.x += lastDirX.current * speed.current * dt;
        player.position.z += lastDirZ.current * speed.current * dt;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -PLAYER_CLAMP_X, PLAYER_CLAMP_X);
        player.position.z = THREE.MathUtils.clamp(
          player.position.z,
          layout.doorTriggerZ,
          layout.entranceZ - 0.5,
        );

        // Each room's display counter (and the cards ringed around it) is
        // solid — walking straight at one just stops her there, projected
        // radially back onto the boundary in whatever direction she
        // approached from, the same way a real display case would.
        layout.roomCenterZ.forEach((centerZ) => {
          const dz = player.position.z - centerZ;
          const dist = Math.hypot(player.position.x, dz);
          if (dist > 0.0001 && dist < COUNTER_COLLISION_RADIUS) {
            const angle = Math.atan2(player.position.x, dz);
            player.position.x = COUNTER_COLLISION_RADIUS * Math.sin(angle);
            player.position.z = centerZ + COUNTER_COLLISION_RADIUS * Math.cos(angle);
          }
        });

        const targetHeading = Math.atan2(lastDirX.current, lastDirZ.current);
        const diff = Math.atan2(Math.sin(targetHeading - player.rotation.y), Math.cos(targetHeading - player.rotation.y));
        player.rotation.y += diff * (reduceMotion ? 1 : Math.min(dt * 10, 1));
      }

      // A soft light that travels with her, like a lantern she's carrying —
      // the fixed room lights only really reach the area right around each
      // display ring, so a long corridor between two category rooms (or the
      // stretch back to the entrance) would otherwise read as a genuinely
      // unlit dead zone with nothing to see or do.
      if (playerLightRef.current) {
        playerLightRef.current.position.set(player.position.x, 2.3, player.position.z);
      }

      if (player.position.z <= layout.doorTriggerZ + 0.02) {
        onReachDoor();
      }

      // idle bob (each card's own pass, independent of selection)
      cardRefs.current.forEach((group, i) => {
        if (!group || reduceMotion) return;
        group.position.y = CARD_Y + Math.sin(t * 1.4 + i) * 0.05;
      });

      // find the nearest card fully before anything reacts to it — a merged
      // single pass would highlight against a still-partial "nearest so far"
      let nearest: number | null = null;
      let nearestDist = SELECT_RADIUS;
      cardRefs.current.forEach((group, i) => {
        if (!group) return;
        const d = Math.hypot(player.position.x - group.position.x, player.position.z - group.position.z);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      });
      if (nearest !== lastSelected.current) {
        lastSelected.current = nearest;
        onSelect(nearest);
      }

      // highlight using the fully resolved nearest index
      cardRefs.current.forEach((group, i) => {
        if (!group) return;
        const targetScale = i === nearest ? 1.12 : 1;
        const s = reduceMotion ? targetScale : THREE.MathUtils.lerp(group.scale.x, targetScale, 0.15);
        group.scale.setScalar(s);
      });

      // third-person follow camera, positioned behind the player relative to their facing
      const forward = new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
      const desiredCam = player.position.clone().addScaledVector(forward, -3.1);
      desiredCam.y = player.position.y + 2.15;
      const follow = reduceMotion ? 1 : Math.min(dt * 4, 1);
      camera.position.lerp(desiredCam, follow);
      const lookAt = player.position.clone().addScaledVector(forward, 1.6);
      lookAt.y = player.position.y + 1.2;
      camera.lookAt(lookAt);

      // Project the nearest card's anchor point to a screen-space pixel
      // position, after the camera above has already been moved this frame
      // — the "nearby item" panel (rendered by the parent, outside the
      // canvas) reads this ref to sit right above whatever card it's about,
      // rather than as a fixed corner panel disconnected from it.
      const nearestGroup = nearest !== null ? cardRefs.current[nearest] : null;
      const anchorEl = anchorRef.current;
      if (nearestGroup && anchorEl) {
        camera.updateMatrixWorld();
        const world = nearestGroup.localToWorld(CARD_ANCHOR_OFFSET.clone());
        world.project(camera);
        anchorEl.style.display = world.z < 1 ? "block" : "none";
        const rawLeft = ((world.x + 1) / 2) * size.width;
        const rawTop = ((1 - world.y) / 2) * size.height;
        // The panel is translated up-and-centered on this point (see its
        // -translate-x-1/2 -translate-y-[...] classes in atelier-journey.tsx)
        // and its containing section clips overflow, so an anchor too close
        // to an edge would otherwise push the panel itself out of view —
        // clamp using its own measured size so it always stays fully
        // on-screen regardless of where the card lands in the frame.
        const pad = 8;
        const w = anchorEl.offsetWidth || 210;
        const h = anchorEl.offsetHeight || 90;
        const tailGap = 14;
        anchorEl.style.left = `${THREE.MathUtils.clamp(rawLeft, w / 2 + pad, size.width - w / 2 - pad)}px`;
        anchorEl.style.top = `${THREE.MathUtils.clamp(rawTop, h + tailGap + pad, size.height - pad + tailGap)}px`;
      } else if (anchorEl) {
        anchorEl.style.display = "none";
      }
    }

    if (stage === "door") {
      if (doorStart.current === null) doorStart.current = t;
      const duration = reduceMotion ? 0.001 : DOOR_DURATION;
      const progress = THREE.MathUtils.clamp((t - doorStart.current) / duration, 0, 1);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

      if (!doorCamFrom.current) doorCamFrom.current = camera.position.clone();
      const to = new THREE.Vector3(-0.2, 1.5, layout.doorZ + 2.1);
      camera.position.lerpVectors(doorCamFrom.current, to, eased);
      camera.lookAt(-0.2, DOOR_H / 2, layout.doorZ);

      if (!doorPlayerFrom.current) doorPlayerFrom.current = player.position.clone();
      player.position.lerpVectors(doorPlayerFrom.current, new THREE.Vector3(-0.2, 0, layout.doorZ - 0.3), eased);

      if (doorPivotRef.current) doorPivotRef.current.rotation.y = -1.95 * eased;
      if (doorGlowRef.current) doorGlowRef.current.intensity = 3.2 * eased;
      if (doorGlowSpriteRef.current) {
        doorGlowSpriteRef.current.scale.setScalar(0.4 + eased * 2.4);
        (doorGlowSpriteRef.current.material as THREE.MeshBasicMaterial).opacity = eased;
      }

      cardRefs.current.forEach((group) => {
        group?.traverse((child) => {
          if (child instanceof THREE.Mesh && "opacity" in child.material) {
            (child.material as THREE.Material & { opacity: number }).opacity = 1 - eased;
          }
        });
      });

      if (progress >= 1 && !doorDone.current) {
        doorDone.current = true;
        doorCamFrom.current = null;
        doorPlayerFrom.current = null;
        onDoorComplete();
      }
    }
  });

  const floorZMin = layout.doorZ - 0.6;
  const floorZMax = layout.entranceZ + 0.6;
  const floorCenterZ = (floorZMin + floorZMax) / 2;
  const floorDepth = floorZMax - floorZMin;

  // Tile size in world units — cheap to set every render, and repeat/wrap
  // changes don't force a texture re-upload the way pixel edits would.
  floorTexture.repeat.set((ROOM_HALF_W * 2) / 2, floorDepth / 2);
  wallTexture.repeat.set(floorDepth / 3, 3.1 / 3);

  return (
    <>
      {/* The wood surfaces themselves carry the dark, deep-brown mood now —
          these lights stay bright enough to actually reveal that material,
          rather than darkening the room twice over into near-blackness. */}
      <hemisphereLight args={[COLORS.cream, COLORS.woodDeep, 1.15]} />
      <directionalLight args={[COLORS.accentSoft, 1.1]} position={[3, 7, 5]} />
      <pointLight args={[COLORS.accentSoft, 0.45]} position={[-4, 3, 3]} />
      <pointLight
        ref={playerLightRef}
        args={[COLORS.accentSoft, 1, 7.5]}
        position={[playerStart.x, 2.3, playerStart.z]}
      />
      <fog attach="fog" args={[COLORS.wood, 9, 26]} />

      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, floorCenterZ]} onClick={handleFloorClick}>
        <planeGeometry args={[ROOM_HALF_W * 2, floorDepth]} />
        <meshStandardMaterial map={floorTexture} roughness={0.9} />
      </mesh>

      {/* walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * ROOM_HALF_W, 1.55, floorCenterZ]} rotation-y={(-side * Math.PI) / 2}>
          <planeGeometry args={[floorDepth, 3.1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* shop props: a curio shelf + hanging paper lantern flanking each
          room's entrance sign, plus a dried-flower bunch over the sign
          itself — the cluttered, warm-lit antique-shop feel from reference */}
      {layout.signs.map((sign) =>
        [-1, 1].map((side) => (
          <group key={`${sign.z}-${side}`} position={[side * (ROOM_HALF_W - 0.55), 0, sign.z]}>
            {/* shelf pedestal */}
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[0.5, 0.9, 0.5]} />
              <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
            </mesh>
            {/* a couple of small jewel-toned jars cluttering the shelf top */}
            {[0, 1].map((j) => (
              <group key={j} position={[(j - 0.5) * 0.14, 0.9, j * 0.1 - 0.05]}>
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.07, 0.08, 0.16, 10]} />
                  <meshStandardMaterial color={JAR_GLASS_TONES[j * 2 + (side > 0 ? 0 : 1)]} roughness={0.35} metalness={0.15} />
                </mesh>
                <mesh position={[0, 0.17, 0]}>
                  <sphereGeometry args={[0.045, 8, 8]} />
                  <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.5} />
                </mesh>
              </group>
            ))}
            {/* paper lantern hanging above the shelf — string stays short
                of the 3.1-high ceiling so it doesn't poke through it */}
            <mesh position={[0, 2.7, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
              <meshStandardMaterial color={COLORS.inkSoft} roughness={0.8} />
            </mesh>
            <pointLight args={[COLORS.accentSoft, 0.55, 3.4]} position={[0, 2.25, 0]} />
            <mesh position={[0, 2.25, 0]} scale={[1, 1.25, 1]}>
              <sphereGeometry args={[0.19, 14, 14]} />
              <meshStandardMaterial color={COLORS.accentSoft} emissive={COLORS.accent} emissiveIntensity={0.55} roughness={0.6} />
            </mesh>
            {[-1, 1].map((cap) => (
              <mesh key={cap} position={[0, 2.25 + cap * 0.24, 0]}>
                <cylinderGeometry args={[cap > 0 ? 0.05 : 0.09, cap > 0 ? 0.02 : 0.02, 0.06, 10]} />
                <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.45} />
              </mesh>
            ))}
          </group>
        )),
      )}

      {/* a dried-flower bunch tied above each room's signpost */}
      {layout.signs.map((sign) => (
        <group key={`flowers-${sign.z}`} position={[0, 3.0, sign.z]}>
          <mesh>
            <torusGeometry args={[0.04, 0.012, 6, 12]} />
            <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.5} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => {
            const spread = (i / 5 - 0.5) * 1.1;
            return (
              <mesh
                key={i}
                position={[spread * 0.22, -0.22 - Math.abs(spread) * 0.08, 0.02]}
                rotation-z={spread * 0.6}
              >
                <coneGeometry args={[0.035, 0.42, 6]} />
                <meshStandardMaterial color={i % 2 === 0 ? DRIED_FLOWER : DRIED_FLOWER_DARK} roughness={0.9} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* category signposts, one per room threshold — front and back are
          separate meshes for the same reason as the cards: a single
          double-sided texture shows mirror-reversed from behind. */}
      {layout.signs.map((sign, i) => (
        <group key={sign.z} position={[0, 2.5, sign.z]}>
          <mesh>
            <planeGeometry args={[2.2, 0.55]} />
            <meshBasicMaterial map={signTextures[i]} side={THREE.FrontSide} />
          </mesh>
          <mesh rotation-y={Math.PI}>
            <planeGeometry args={[2.2, 0.55]} />
            <meshStandardMaterial color={COLORS.ink} roughness={0.85} side={THREE.FrontSide} />
          </mesh>
        </group>
      ))}

      {/* a display counter per room: a round wooden base under each ring */}
      {layout.roomCenterZ.map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[RADIUS_CAT * 0.55, COUNTER_RADIUS, 0.9, 32]} />
            <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[COUNTER_RADIUS - 0.04, 0.035, 8, 32]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* rings of floating jewelry cards, one ring per category room */}
      {layout.cards.map((card, i) => (
        <group
          key={`${card.item.category}-${card.item.slug}`}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          position={[card.x, CARD_Y, card.z]}
          rotation-y={card.angle}
          onClick={handleCardClick(i)}
        >
          {/* rotation lives on the group, not the mesh, so it stays in sync
              with the card's shadow (see below). Front and back are separate
              meshes rather than one double-sided plane — a single texture on
              both sides would show the title mirror-reversed from behind,
              which is routinely visible once the corridor has more than one
              room to walk past. */}
          <mesh>
            <planeGeometry args={[1.15, 1.55]} />
            <meshBasicMaterial map={cardTextures[i]} transparent side={THREE.FrontSide} />
          </mesh>
          <mesh rotation-y={Math.PI}>
            <planeGeometry args={[1.15, 1.55]} />
            <meshStandardMaterial color={COLORS.creamDeep} roughness={0.85} side={THREE.FrontSide} />
          </mesh>
          <mesh position={[0, -1.93, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.62, 24]} />
            <meshBasicMaterial color={COLORS.ink} transparent opacity={0.12} />
          </mesh>
        </group>
      ))}

      {/* selection glow ring beneath the nearest card */}
      {selectedIndex !== null && layout.cards[selectedIndex] && (
        <mesh rotation-x={-Math.PI / 2} position={[layout.cards[selectedIndex].x, 0.03, layout.cards[selectedIndex].z]}>
          <ringGeometry args={[0.58, 0.72, 40]} />
          <meshBasicMaterial color={COLORS.accent} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* vintage door: DOOR_W wide, DOOR_H tall, hinged at its left edge */}
      <group ref={doorPivotRef} position={[-DOOR_W / 2, 0, layout.doorZ]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]}>
          <planeGeometry args={[DOOR_W, DOOR_H]} />
          <meshStandardMaterial color={COLORS.woodLight} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, DOOR_H, layout.doorZ]} rotation-z={Math.PI}>
        <torusGeometry args={[DOOR_W / 2 + 0.12, 0.08, 8, 24, Math.PI]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR_W / 2 + 0.06), DOOR_H / 2, layout.doorZ]}>
          <boxGeometry args={[0.1, DOOR_H, 0.1]} />
          <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <pointLight ref={doorGlowRef} args={[COLORS.accentSoft, 0, 10]} position={[0, DOOR_H * 0.65, layout.doorZ - 0.4]} />
      {/* the visible shape of that light spilling through the doorway as it
          opens — a plain point light has no visible glow of its own without
          bloom post-processing, which this scene doesn't have */}
      <mesh ref={doorGlowSpriteRef} position={[0, DOOR_H * 0.55, layout.doorZ - 0.15]} scale={0.001}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTexture}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* the player: a rigged customer figure walking the shop floor */}
      <group ref={playerRef} position={playerStart} rotation-y={Math.PI}>
        <CustomerModel movingRef={movingRef} speedRef={speed} baseSpeed={MOVE_SPEED} reduceMotion={reduceMotion} />
        <mesh position={[0, 0.015, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.34, 20]} />
          <meshBasicMaterial color={COLORS.ink} transparent opacity={0.2} />
        </mesh>
      </group>
    </>
  );
}
