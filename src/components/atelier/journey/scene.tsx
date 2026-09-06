"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeCardTexture } from "./card-texture";
import type { JourneyItem, JourneyStage } from "./types";

// Room layout constants — everything else in this file is derived from these.
const RADIUS = 3.4; // radius of the jewelry ring
const CARD_Y = 1.95;
const DOOR_W = 1.1;
const DOOR_H = 2.2;
const DOOR_Z = -(RADIUS + 2.6);
const DOOR_TRIGGER_Z = DOOR_Z + 1.6; // walking this close auto-opens the door
const ROOM_HALF_W = 4.6;
const ENTRANCE_Z = RADIUS + 4.2;
const PLAYER_CLAMP_X = ROOM_HALF_W - 0.5;
const SELECT_RADIUS = 2.1;
const MOVE_SPEED = 3.3;
const DOOR_DURATION = 1.6;

const PLAYER_START = new THREE.Vector3(0, 0, ENTRANCE_Z - 1.0);

const COLORS = {
  cream: "#f6f1e9",
  creamDeep: "#efe7d8",
  ink: "#211c17",
  inkSoft: "#4a433b",
  accent: "#c9622c",
  accentSoft: "#e7ad82",
  brass: "#b8863f",
};

function angleFor(index: number, total: number) {
  return (index / total) * Math.PI * 2;
}

export function Scene({
  items,
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
  items: JourneyItem[];
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
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const cardTextures = useMemo(
    () => items.map((item) => makeCardTexture(item, displayFont, sansFont)),
    [items, displayFont, sansFont],
  );

  const keys = useRef<Record<string, boolean>>({});
  const moveTarget = useRef<{ x: number; z: number } | null>(null);
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

  const cardAngles = useMemo(
    () => items.map((_, i) => angleFor(i, items.length)),
    [items],
  );

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
    if (playerRef.current) playerRef.current.position.copy(PLAYER_START);
    if (playerRef.current) playerRef.current.rotation.y = Math.PI;
    if (doorPivotRef.current) doorPivotRef.current.rotation.y = 0;
    if (doorGlowRef.current) doorGlowRef.current.intensity = 0;
    moveTarget.current = null;
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
  }, [stage]);

  function handleFloorClick(event: ThreeEvent<MouseEvent>) {
    if (stage !== "room") return;
    event.stopPropagation();
    moveTarget.current = { x: event.point.x, z: event.point.z };
  }

  function handleCardClick(index: number) {
    return (event: ThreeEvent<MouseEvent>) => {
      if (stage !== "room") return;
      event.stopPropagation();
      const angle = cardAngles[index];
      const dir = new THREE.Vector2(Math.sin(angle), Math.cos(angle));
      moveTarget.current = { x: dir.x * (RADIUS - 1.15), z: dir.y * (RADIUS - 1.15) };
    };
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const player = playerRef.current;
    if (!player) return;

    if (stage === "room") {
      let dx = 0;
      let dz = 0;
      const k = keys.current;
      const kx = (k["arrowleft"] || k["a"] ? -1 : 0) + (k["arrowright"] || k["d"] ? 1 : 0);
      const kz = (k["arrowup"] || k["w"] ? -1 : 0) + (k["arrowdown"] || k["s"] ? 1 : 0);
      if (kx !== 0 || kz !== 0) {
        const len = Math.hypot(kx, kz) || 1;
        dx = kx / len;
        dz = kz / len;
      } else if (moveTarget.current) {
        const tdx = moveTarget.current.x - player.position.x;
        const tdz = moveTarget.current.z - player.position.z;
        const dist = Math.hypot(tdx, tdz);
        if (dist > 0.12) {
          dx = tdx / dist;
          dz = tdz / dist;
        } else {
          moveTarget.current = null;
        }
      }

      const moving = dx !== 0 || dz !== 0;
      if (moving) {
        player.position.x += dx * MOVE_SPEED * dt;
        player.position.z += dz * MOVE_SPEED * dt;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -PLAYER_CLAMP_X, PLAYER_CLAMP_X);
        player.position.z = THREE.MathUtils.clamp(player.position.z, DOOR_TRIGGER_Z, ENTRANCE_Z - 0.5);
        const targetHeading = Math.atan2(dx, dz);
        const diff = Math.atan2(Math.sin(targetHeading - player.rotation.y), Math.cos(targetHeading - player.rotation.y));
        player.rotation.y += diff * (reduceMotion ? 1 : Math.min(dt * 10, 1));
        const bob = reduceMotion ? 0 : Math.sin(t * 9) * 0.035;
        if (bodyRef.current) bodyRef.current.position.y = 0.52 + bob;
        if (headRef.current) headRef.current.position.y = 1.02 + bob;
      }

      if (player.position.z <= DOOR_TRIGGER_Z + 0.02) {
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
      const to = new THREE.Vector3(-0.2, 1.5, DOOR_Z + 2.1);
      camera.position.lerpVectors(doorCamFrom.current, to, eased);
      camera.lookAt(-0.2, DOOR_H / 2, DOOR_Z);

      if (!doorPlayerFrom.current) doorPlayerFrom.current = player.position.clone();
      player.position.lerpVectors(doorPlayerFrom.current, new THREE.Vector3(-0.2, 0, DOOR_Z - 0.3), eased);

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

  return (
    <>
      <hemisphereLight args={[COLORS.cream, COLORS.inkSoft, 0.9]} />
      <directionalLight args={[COLORS.accentSoft, 0.8]} position={[3, 7, 5]} />
      <pointLight args={[COLORS.cream, 0.35]} position={[-4, 3, 3]} />
      <fog attach="fog" args={[COLORS.cream, 7, 24]} />

      {/* floor */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, (DOOR_Z - 0.6 + ENTRANCE_Z + 0.6) / 2]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[ROOM_HALF_W * 2, ENTRANCE_Z + 0.6 - (DOOR_Z - 0.6)]} />
        <meshStandardMaterial color="#d9c7a8" roughness={0.9} />
      </mesh>

      {/* walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * ROOM_HALF_W, 1.55, (DOOR_Z - 0.6 + ENTRANCE_Z + 0.6) / 2]}
          rotation-y={(-side * Math.PI) / 2}
        >
          <planeGeometry args={[ENTRANCE_Z + 0.6 - (DOOR_Z - 0.6), 3.1]} />
          <meshStandardMaterial color={COLORS.creamDeep} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* shop props: shelves + lanterns along the walls */}
      {[DOOR_Z + 1.4, (DOOR_Z + ENTRANCE_Z) / 2, ENTRANCE_Z - 1.6].map((z) =>
        [-1, 1].map((side) => {
          const x = side * (ROOM_HALF_W - 0.55);
          return (
            <group key={`${z}-${side}`} position={[x, 0, z]}>
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
          );
        }),
      )}

      {/* ring of floating jewelry cards */}
      {items.map((item, i) => {
        const angle = cardAngles[i];
        const x = RADIUS * Math.sin(angle);
        const z = RADIUS * Math.cos(angle);
        return (
          <group
            key={item.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            position={[x, CARD_Y, z]}
            rotation-y={angle}
            onClick={handleCardClick(i)}
          >
            {/* rotation lives on the group, not the mesh, so it stays in sync
                with the card's shadow (see below) */}
            <mesh>
              <planeGeometry args={[1.15, 1.55]} />
              <meshBasicMaterial map={cardTextures[i]} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -1.93, 0]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.62, 24]} />
              <meshBasicMaterial color={COLORS.ink} transparent opacity={0.12} />
            </mesh>
          </group>
        );
      })}

      {/* selection glow ring beneath the nearest card */}
      {selectedIndex !== null && (
        <mesh
          rotation-x={-Math.PI / 2}
          position={[
            RADIUS * Math.sin(cardAngles[selectedIndex]),
            0.03,
            RADIUS * Math.cos(cardAngles[selectedIndex]),
          ]}
        >
          <ringGeometry args={[0.58, 0.72, 40]} />
          <meshBasicMaterial color={COLORS.accent} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* vintage door: DOOR_W wide, DOOR_H tall, hinged at its left edge */}
      <group ref={doorPivotRef} position={[-DOOR_W / 2, 0, DOOR_Z]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]}>
          <planeGeometry args={[DOOR_W, DOOR_H]} />
          <meshStandardMaterial color="#a9713f" roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, DOOR_H, DOOR_Z]} rotation-z={Math.PI}>
        <torusGeometry args={[DOOR_W / 2 + 0.12, 0.08, 8, 24, Math.PI]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR_W / 2 + 0.06), DOOR_H / 2, DOOR_Z]}>
          <boxGeometry args={[0.1, DOOR_H, 0.1]} />
          <meshStandardMaterial color={COLORS.brass} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <pointLight ref={doorGlowRef} args={[COLORS.accentSoft, 0, 8]} position={[0, DOOR_H * 0.65, DOOR_Z - 0.4]} />

      {/* the player: a small stylized figure standing in for the customer */}
      <group ref={playerRef} position={PLAYER_START} rotation-y={Math.PI}>
        <mesh ref={bodyRef} position={[0, 0.52, 0]}>
          <capsuleGeometry args={[0.26, 0.55, 4, 8]} />
          <meshStandardMaterial color={COLORS.ink} roughness={0.7} />
        </mesh>
        <mesh ref={headRef} position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={COLORS.accentSoft} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.02, 0.22]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.06, 0.16, 8]} />
          <meshStandardMaterial color={COLORS.accent} />
        </mesh>
        <mesh position={[0, 0.015, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.34, 20]} />
          <meshBasicMaterial color={COLORS.ink} transparent opacity={0.2} />
        </mesh>
      </group>
    </>
  );
}
