"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeCardTexture, makeSignTexture } from "./card-texture";
import { CustomerModel } from "./customer-model";
import type { CategoryRoom } from "./get-journey-items";
import type { JourneyStage } from "./types";

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
const COUNTER_COLLISION_RADIUS = COUNTER_RADIUS + 0.35;
const MOVE_SPEED = 3.3;
const MAX_CLICK_MOVE = 6; // cap on how far a single floor click can send the player
const DOOR_DURATION = 1.6;

const COLORS = {
  cream: "#f6f1e9",
  creamDeep: "#efe7d8",
  ink: "#211c17",
  inkSoft: "#4a433b",
  accent: "#c9622c",
  accentSoft: "#e7ad82",
  brass: "#b8863f",
};

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
}) {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const doorPivotRef = useRef<THREE.Group>(null);
  const doorGlowRef = useRef<THREE.PointLight>(null);
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

  const keys = useRef<Record<string, boolean>>({});
  const moveTarget = useRef<{ x: number; z: number } | null>(null);
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
      if (moveKeys.includes(e.key.toLowerCase())) moveTarget.current = null;
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

  // explicit "try this piece on" button request, mirrors walking up to the door
  useEffect(() => {
    if (doorRequestToken !== lastDoorToken.current) {
      lastDoorToken.current = doorRequestToken;
      if (stage === "room") onReachDoor();
    }
  }, [doorRequestToken, stage, onReachDoor]);

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
    moveTarget.current = null;
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
    moveTarget.current = { x: player.x + dx * scale, z: player.z + dz * scale };
  }

  function handleCardClick(index: number) {
    return (event: ThreeEvent<MouseEvent>) => {
      if (stage !== "room") return;
      event.stopPropagation();
      const card = layout.cards[index];
      const dir = new THREE.Vector2(card.x, card.z - card.centerZ).normalize();
      // Stop just outside the counter's solid collision radius, not partway
      // toward the ring center — the counter physically blocks anything closer.
      const standDist = COUNTER_COLLISION_RADIUS + 0.15;
      moveTarget.current = {
        x: dir.x * standDist,
        z: card.centerZ + dir.y * standDist,
      };
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
        } else {
          moveTarget.current = null;
        }
      }

      const hasInput = inputX !== 0 || inputZ !== 0;
      if (hasInput) {
        lastDirX.current = inputX;
        lastDirZ.current = inputZ;
      }

      // Ease speed toward its target instead of snapping, so a step starts
      // and ends with a glide rather than a jump-cut.
      const targetSpeed = hasInput ? MOVE_SPEED : 0;
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

        // Each room's display counter is solid. Snapping straight back to
        // the boundary (pure radial push-out) traps anyone walking dead
        // straight at the center — x never leaves 0, so they'd sit pinned
        // against it forever holding "forward". Instead slide clockwise
        // around the rim while in contact, so holding one direction still
        // carries you all the way around and out the other side.
        layout.roomCenterZ.forEach((centerZ) => {
          const dz = player.position.z - centerZ;
          const dist = Math.hypot(player.position.x, dz);
          if (dist > 0.0001 && dist < COUNTER_COLLISION_RADIUS) {
            const angle = Math.atan2(player.position.x, dz) + 2 * dt;
            player.position.x = COUNTER_COLLISION_RADIUS * Math.sin(angle);
            player.position.z = centerZ + COUNTER_COLLISION_RADIUS * Math.cos(angle);
          }
        });

        const targetHeading = Math.atan2(lastDirX.current, lastDirZ.current);
        const diff = Math.atan2(Math.sin(targetHeading - player.rotation.y), Math.cos(targetHeading - player.rotation.y));
        player.rotation.y += diff * (reduceMotion ? 1 : Math.min(dt * 10, 1));
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
      if (doorGlowRef.current) doorGlowRef.current.intensity = 2.4 * eased;

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

  return (
    <>
      <hemisphereLight args={[COLORS.cream, COLORS.inkSoft, 0.9]} />
      <directionalLight args={[COLORS.accentSoft, 0.8]} position={[3, 7, 5]} />
      <pointLight args={[COLORS.cream, 0.35]} position={[-4, 3, 3]} />
      <fog attach="fog" args={[COLORS.cream, 7, 24]} />

      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, floorCenterZ]} onClick={handleFloorClick}>
        <planeGeometry args={[ROOM_HALF_W * 2, floorDepth]} />
        <meshStandardMaterial color="#d9c7a8" roughness={0.9} />
      </mesh>

      {/* walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * ROOM_HALF_W, 1.55, floorCenterZ]} rotation-y={(-side * Math.PI) / 2}>
          <planeGeometry args={[floorDepth, 3.1]} />
          <meshStandardMaterial color={COLORS.creamDeep} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* shop props: a shelf + lantern flanking each room's entrance sign */}
      {layout.signs.map((sign) =>
        [-1, 1].map((side) => (
          <group key={`${sign.z}-${side}`} position={[side * (ROOM_HALF_W - 0.55), 0, sign.z]}>
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[0.5, 0.9, 0.5]} />
              <meshStandardMaterial color={COLORS.brass} roughness={0.6} metalness={0.25} />
            </mesh>
            <pointLight args={[COLORS.accentSoft, 0.5, 3.2]} position={[0, 1.15, 0]} />
            <mesh position={[0, 1.15, 0]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshStandardMaterial color={COLORS.accentSoft} emissive={COLORS.accent} emissiveIntensity={0.6} />
            </mesh>
          </group>
        )),
      )}

      {/* category signposts, one per room threshold */}
      {layout.signs.map((sign, i) => (
        <mesh key={sign.z} position={[0, 2.5, sign.z]}>
          <planeGeometry args={[2.2, 0.55]} />
          <meshBasicMaterial map={signTextures[i]} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* a display counter per room: a round wooden base under each ring */}
      {layout.roomCenterZ.map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[RADIUS_CAT * 0.55, COUNTER_RADIUS, 0.9, 32]} />
            <meshStandardMaterial color="#8a5a34" roughness={0.7} />
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
          <meshStandardMaterial color="#a9713f" roughness={0.7} />
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
      <pointLight ref={doorGlowRef} args={[COLORS.accentSoft, 0, 8]} position={[0, DOOR_H * 0.65, layout.doorZ - 0.4]} />

      {/* the player: a rigged customer figure walking the shop floor */}
      <group ref={playerRef} position={playerStart} rotation-y={Math.PI}>
        <CustomerModel movingRef={movingRef} reduceMotion={reduceMotion} />
        <mesh position={[0, 0.015, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.34, 20]} />
          <meshBasicMaterial color={COLORS.ink} transparent opacity={0.2} />
        </mesh>
      </group>
    </>
  );
}
