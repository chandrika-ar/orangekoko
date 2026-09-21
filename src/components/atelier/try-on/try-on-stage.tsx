"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CameraGate } from "./camera-gate";
import { startFaceTracking, type FaceAnchors } from "./face-tracking";
import type { JourneyItem } from "../journey/types";

type CameraState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

// Fallback screen position (fraction of the video box) for whenever a face
// isn't currently being tracked — no face in frame yet, the model is still
// loading, or tracking failed to start at all. Matches where these used to
// sit permanently before real tracking existed.
const DEFAULT_POS = {
  necklace: { x: 0.5, y: 0.62 },
  earLeft: { x: 0.36, y: 0.44 },
  earRight: { x: 0.64, y: 0.44 },
};
const NECKLACE_SIZE = 60;
const EAR_SIZE = 40;

/**
 * Live camera mirror with the selected piece overlaid at the wearer's actual
 * ear/neck position, tracked frame-by-frame from MediaPipe face landmarks
 * (see face-tracking.ts) — falls back to a fixed approximate position
 * whenever no face is currently detected, so the view never shows nothing.
 */
export function TryOnStage({ item }: { item: JourneyItem | null }) {
  const t = useTranslations("atelierJourney");
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const necklaceRef = useRef<HTMLDivElement>(null);
  const earLeftRef = useRef<HTMLDivElement>(null);
  const earRightRef = useRef<HTMLDivElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // The <video> element below only exists once cameraState is "granted" —
  // while permission is still being requested, this component renders
  // CameraGate instead, so videoRef.current is null at that point no matter
  // what. Attaching the stream has to wait until the video element has
  // actually mounted, which happens on the render this effect reacts to.
  useEffect(() => {
    if (cameraState !== "granted" || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [cameraState]);

  // Positions the three overlay boxes each frame — imperative, not React
  // state, so this can run at video framerate without a re-render per frame
  // (the same pattern the 3D scene uses for its own per-frame updates).
  useEffect(() => {
    if (cameraState !== "granted" || !videoRef.current) return;
    const video = videoRef.current;

    function place(
      el: HTMLDivElement | null,
      xPx: number,
      yPx: number,
      sizePx: number,
      rotateRad: number,
    ) {
      if (!el) return;
      el.style.width = `${sizePx}px`;
      el.style.height = `${sizePx}px`;
      el.style.transform = `translate(${xPx - sizePx / 2}px, ${yPx - sizePx / 2}px) rotate(${rotateRad}rad)`;
    }

    function placeDefaults() {
      const box = stageRef.current;
      if (!box) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      place(necklaceRef.current, DEFAULT_POS.necklace.x * w, DEFAULT_POS.necklace.y * h, NECKLACE_SIZE, 0);
      place(earLeftRef.current, DEFAULT_POS.earLeft.x * w, DEFAULT_POS.earLeft.y * h, EAR_SIZE, 0);
      place(earRightRef.current, DEFAULT_POS.earRight.x * w, DEFAULT_POS.earRight.y * h, EAR_SIZE, 0);
    }

    // Maps a landmark normalized to the raw camera frame into a pixel
    // position within the (possibly differently-aspected) display box,
    // replicating the same crop/scale `object-cover` applies to the video
    // itself — otherwise tracked points drift off the actual face whenever
    // the camera's native aspect ratio doesn't match the box.
    function toBoxPx(nx: number, ny: number) {
      const box = stageRef.current;
      if (!box || !video.videoWidth || !video.videoHeight) return null;
      const boxW = box.clientWidth;
      const boxH = box.clientHeight;
      const scale = Math.max(boxW / video.videoWidth, boxH / video.videoHeight);
      const renderedW = video.videoWidth * scale;
      const renderedH = video.videoHeight * scale;
      const offsetX = (boxW - renderedW) / 2;
      const offsetY = (boxH - renderedH) / 2;
      return { x: offsetX + nx * renderedW, y: offsetY + ny * renderedH, renderedW, renderedH };
    }

    function onFrame(anchors: FaceAnchors | null) {
      if (!anchors) {
        placeDefaults();
        return;
      }
      const left = toBoxPx(anchors.leftEar.x, anchors.leftEar.y);
      const right = toBoxPx(anchors.rightEar.x, anchors.rightEar.y);
      const neck = toBoxPx(anchors.neck.x, anchors.neck.y);
      if (!left || !right || !neck) {
        placeDefaults();
        return;
      }
      const earSpanPx = Math.hypot(right.x - left.x, right.y - left.y);
      const rollRad = Math.atan2(right.y - left.y, right.x - left.x);
      const earSize = clamp(earSpanPx * 0.32, 22, 90);
      const neckSize = clamp(earSpanPx * 0.55, 28, 120);

      place(earLeftRef.current, left.x, left.y, earSize, rollRad);
      place(earRightRef.current, right.x, right.y, earSize, rollRad);
      place(necklaceRef.current, neck.x, neck.y, neckSize, rollRad);
    }

    placeDefaults();
    const stop = startFaceTracking(video, onFrame, () => {
      // Model/WASM failed to load (offline, blocked CDN, unsupported
      // browser) — the fixed default position placed above just stays put.
    });
    return stop;
  }, [cameraState]);

  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState("granted");
    } catch {
      setCameraState("denied");
    }
  }

  if (cameraState !== "granted") {
    const note =
      cameraState === "denied"
        ? t("cameraDenied")
        : cameraState === "unsupported"
          ? t("cameraUnsupported")
          : t("cameraNote");
    return (
      <CameraGate
        heading={t("cameraHeading")}
        note={note}
        buttonLabel={t("cameraAllow")}
        onAllow={requestCamera}
      />
    );
  }

  const isNecklace = item?.category === "necklaces";
  const photo = item?.imageUrl;

  return (
    <div ref={stageRef} className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-sm border border-line bg-ink">
      {/* video + overlays share one mirror transform so tracked points (computed
          against the raw, unmirrored camera frame) land in the right spot
          without needing to flip the math by hand */}
      <div className="absolute inset-0 -scale-x-100">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

        <div ref={necklaceRef} className={`absolute left-0 top-0 ${isNecklace ? "" : "hidden"}`}>
          <OverlayDot photo={photo} shadow="shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
        </div>
        <div ref={earLeftRef} className={`absolute left-0 top-0 ${isNecklace ? "hidden" : ""}`}>
          <OverlayDot photo={photo} shadow="shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        </div>
        <div ref={earRightRef} className={`absolute left-0 top-0 ${isNecklace ? "hidden" : ""}`}>
          <OverlayDot photo={photo} shadow="shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-1.5 text-center text-[9px] uppercase tracking-[0.08em] text-white">
        {t("approxPlacement")}
      </p>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function OverlayDot({ photo, shadow }: { photo: string | undefined; shadow: string }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small tracked overlay thumbnail, not a page image
      <img
        src={photo}
        alt=""
        className={`h-full w-full rounded-full border-2 border-white/80 bg-white object-cover ${shadow}`}
      />
    );
  }
  return <div className={`h-full w-full rounded-full bg-accent ${shadow}`} />;
}
