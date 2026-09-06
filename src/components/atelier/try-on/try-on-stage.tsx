"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CameraGate } from "./camera-gate";
import type { JourneyItem } from "../journey/types";

type CameraState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

/**
 * Live camera mirror with an approximately-placed overlay for the selected
 * piece — NOT face-tracked yet. Real landmark tracking (see the design doc's
 * "阶段一/阶段二" split) needs a model fetched from Google's model host plus
 * the @mediapipe/tasks-vision WASM runtime, and — more importantly — a human
 * looking at a real face through a real camera to tune where the landmarks
 * actually put the earring/necklace. Neither is possible to verify from a
 * sandboxed dev container, so this ships the honest, testable slice: real
 * camera access, real mirror, a fixed approximate position.
 */
export function TryOnStage({ item }: { item: JourneyItem | null }) {
  const t = useTranslations("atelierJourney");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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
    <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-sm border border-line bg-ink">
      <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />

      {isNecklace ? (
        <span className="absolute left-1/2 top-[64%] h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_10px_rgba(201,98,44,0.8)]" />
      ) : (
        <>
          <span className="absolute left-[36%] top-[46%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(201,98,44,0.8)]" />
          <span className="absolute left-[64%] top-[46%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(201,98,44,0.8)]" />
        </>
      )}

      <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-1.5 text-center text-[9px] uppercase tracking-[0.08em] text-white">
        {t("approxPlacement")}
      </p>
    </div>
  );
}
