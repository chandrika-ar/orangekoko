"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CameraGate } from "./camera-gate";
import { cutoutNearWhite } from "./cutout";
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
  const cutoutPhoto = useCutoutPhoto(item?.imageUrl);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const necklaceRef = useRef<HTMLDivElement>(null);
  const earLeftRef = useRef<HTMLDivElement>(null);
  const earRightRef = useRef<HTMLDivElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  // "idle" (nothing has run yet), "active" (the model loaded and is
  // currently reading real face positions) or "unavailable" (the model/WASM
  // failed to load, or loaded but this browser has never actually returned
  // a detected face) — surfaced as a small status dot so it's visible in a
  // screenshot rather than a silent, invisible fallback.
  const [trackingStatus, setTrackingStatus] = useState<"idle" | "active" | "unavailable">("idle");

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

    // Anchored by its top-center edge, not its middle — a real earring or
    // pendant hangs *below* where it actually attaches (the earlobe, the
    // neck) rather than floating centered on that point, and pairing that
    // with transform-origin: 50% 0% (see the JSX) means head tilt swings
    // it naturally from that attach point too, like it's actually hanging
    // off her, instead of just spinning a floating circle in place.
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
      el.style.transform = `translate(${xPx - sizePx / 2}px, ${yPx}px) rotate(${rotateRad}rad)`;
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
      setTrackingStatus(anchors ? "active" : "idle");
      if (!anchors) {
        placeDefaults();
        return;
      }
      const left = toBoxPx(anchors.leftEar.x, anchors.leftEar.y);
      const right = toBoxPx(anchors.rightEar.x, anchors.rightEar.y);
      const neck = toBoxPx(anchors.neck.x, anchors.neck.y);
      const eyeL = toBoxPx(anchors.eyeLeft.x, anchors.eyeLeft.y);
      const eyeR = toBoxPx(anchors.eyeRight.x, anchors.eyeRight.y);
      if (!left || !right || !neck || !eyeL || !eyeR) {
        placeDefaults();
        return;
      }
      const earSpanPx = Math.hypot(right.x - left.x, right.y - left.y);
      // Rotation comes from the eye corners, not the ear anchors — those
      // are already an extrapolated approximation (see face-tracking.ts),
      // and two nearby, uncertain points make atan2 read far more tilted
      // than the head actually is for even a small amount of per-point
      // noise. The eye corners are a much more stable, wider baseline.
      const rollRad = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x);
      const earSize = clamp(earSpanPx * 0.32, 22, 90);
      const neckSize = clamp(earSpanPx * 0.55, 28, 120);

      place(earLeftRef.current, left.x, left.y, earSize, rollRad);
      place(earRightRef.current, right.x, right.y, earSize, rollRad);
      place(necklaceRef.current, neck.x, neck.y, neckSize, rollRad);
    }

    placeDefaults();
    const stop = startFaceTracking(video, onFrame, () => {
      // Model/WASM failed to load (offline, blocked host, unsupported
      // browser) — the fixed default position placed above just stays put.
      setTrackingStatus("unavailable");
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

  return (
    <div ref={stageRef} className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-sm border border-line bg-ink">
      {/* video + overlays share one mirror transform so tracked points (computed
          against the raw, unmirrored camera frame) land in the right spot
          without needing to flip the math by hand */}
      <div className="absolute inset-0 -scale-x-100">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

        <div
          ref={necklaceRef}
          className={`absolute left-0 top-0 ${isNecklace ? "" : "hidden"}`}
          style={{ transformOrigin: "50% 0%" }}
        >
          <OverlayDot photo={cutoutPhoto} shadow="shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
        </div>
        <div
          ref={earLeftRef}
          className={`absolute left-0 top-0 ${isNecklace ? "hidden" : ""}`}
          style={{ transformOrigin: "50% 0%" }}
        >
          <OverlayDot photo={cutoutPhoto} shadow="shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        </div>
        <div
          ref={earRightRef}
          className={`absolute left-0 top-0 ${isNecklace ? "hidden" : ""}`}
          style={{ transformOrigin: "50% 0%" }}
        >
          <OverlayDot photo={cutoutPhoto} shadow="shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      {/* Small, language-agnostic status dot: green once real face tracking
          is actually reading a face, gray while idle/loading, red if the
          model failed to load entirely — so a screenshot alone shows
          whether the overlay above is really tracked or just the fallback
          position, instead of that being invisible. */}
      <span
        className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-white/50 ${
          trackingStatus === "active"
            ? "bg-emerald-400"
            : trackingStatus === "unavailable"
              ? "bg-red-500"
              : "bg-white/40"
        }`}
      />

      <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-1.5 text-center text-[9px] uppercase tracking-[0.08em] text-white">
        {t("approxPlacement")}
      </p>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// A hard-edged circle with a solid white ring reads as a sticker pasted on
// top of the video, not something actually worn — most of that comes from
// the product photo's own flat studio-white background showing right up to
// a crisp boundary. `photo` is the *cutout* version (see cutout.ts, applied
// in useCutoutPhoto below) with that background already made transparent,
// so the item's own silhouette is what shows, not a white square — object-
// contain rather than object-cover, so an elongated piece (a long chain,
// a wide pair of drops) isn't cropped into a circle it was never meant to
// fill. The feathered mask stays only as a safety net for the brief window
// before the cutout is ready (or if it fails), where `photo` is still the
// plain, white-backed original.
const FEATHERED_MASK = "radial-gradient(circle, black 55%, transparent 78%)";

function OverlayDot({ photo, shadow }: { photo: string | undefined; shadow: string }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small tracked overlay thumbnail, not a page image
      <img
        src={photo}
        alt=""
        className={`h-full w-full object-contain ${shadow}`}
        style={{ maskImage: FEATHERED_MASK, WebkitMaskImage: FEATHERED_MASK }}
      />
    );
  }
  return <div className={`h-full w-full rounded-full bg-accent ${shadow}`} />;
}

/** Runs the selected item's photo through the near-white cutout (see
 * cutout.ts) once per photo URL, caching results across re-selection so
 * switching back to an already-processed item is instant. Returns the
 * original photo immediately (so something shows right away) and swaps to
 * the cutout once it's ready. */
const cutoutCache = new Map<string, string>();

function useCutoutPhoto(photo: string | undefined) {
  // Ready results are cached synchronously (module-scope Map, keyed by the
  // source photo URL), so they're derived directly during render rather
  // than round-tripped through state — only the genuinely async case (a
  // photo not processed yet) needs an effect + setState at all.
  const [pending, setPending] = useState<{ photo: string; url: string } | null>(null);

  useEffect(() => {
    if (!photo || cutoutCache.has(photo)) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const cutout = cutoutNearWhite(img);
      cutoutCache.set(photo, cutout);
      setPending({ photo, url: cutout });
    };
    img.onerror = () => {
      // A silent failure here (a rejected /_next/image request, a network
      // error) previously looked identical to "the cutout ran and found
      // nothing to remove" — there was no way to tell them apart. Logging
      // at least means a failure is visible in devtools instead of only
      // showing up as an unexplained "nothing changed" report.
      if (!cancelled) console.error("Try-on photo cutout failed to load:", img.src);
    };
    // Routed through /_next/image rather than fetched directly — reading
    // pixel data back out of the canvas below requires the image to have
    // loaded without tainting it, which a cross-origin fetch can't
    // guarantee (see the identical fix for the 3D card's own photo texture).
    // w=640&q=75 — Next's image optimizer only serves widths/qualities it
    // was configured for (defaults: deviceSizes for width, [75] for
    // quality); 320 and 90 aren't in those lists and get flatly rejected
    // with a 400, which silently killed this whole pipeline until caught
    // by hand — img.onload never fires, so it looked like no processing
    // had happened at all rather than an obvious broken-image failure.
    img.src = `/_next/image?url=${encodeURIComponent(photo)}&w=640&q=75`;
    return () => {
      cancelled = true;
    };
  }, [photo]);

  if (!photo) return undefined;
  const cached = cutoutCache.get(photo);
  if (cached) return cached;
  if (pending && pending.photo === photo) return pending.url;
  return photo;
}
