"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { CanvasStage } from "@/components/atelier/three/canvas-stage";
import { ExperienceFallback } from "@/components/atelier/three/experience-fallback";
import { useWebglSupport } from "@/components/atelier/three/use-webgl-support";
import { TryOnStage } from "@/components/atelier/try-on/try-on-stage";
import type { CategoryRoom } from "./get-journey-items";
import { Scene } from "./scene";
import type { JourneyStage } from "./types";

export default function AtelierJourney({ rooms }: { rooms: CategoryRoom[] }) {
  const t = useTranslations("atelierJourney");
  const support = useWebglSupport();
  // Flattened in the same room-then-item order Scene lays cards out in, so
  // `selectedIndex` (an index into this list) means the same card in both.
  const items = useMemo(() => rooms.flatMap((r) => r.items), [rooms]);

  const [stage, setStage] = useState<JourneyStage>("room");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [doorRequestToken, setDoorRequestToken] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(support.reducedMotion);
  const [hasMoved, setHasMoved] = useState(false);

  // The ring cards draw their own labels onto a canvas texture rather than
  // fetching a font at runtime (see card-texture.ts), so they need the site's
  // actual computed font stacks, read off real DOM elements using those classes.
  const fontProbeRef = useRef<HTMLDivElement>(null);
  const [fonts, setFonts] = useState({ display: "Georgia, serif", sans: "Arial, sans-serif" });
  useEffect(() => {
    const probe = fontProbeRef.current;
    if (!probe) return;
    const displayEl = probe.querySelector<HTMLElement>("[data-font-display]");
    setFonts({
      display: displayEl ? getComputedStyle(displayEl).fontFamily : "Georgia, serif",
      sans: getComputedStyle(document.body).fontFamily,
    });
  }, []);

  if (support.webgl === false) {
    return (
      <ExperienceFallback
        title={t("fallbackTitle")}
        body={t("fallbackBody")}
        cta={t("fallbackCta")}
      />
    );
  }

  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <section className="relative h-[78vh] min-h-[560px] overflow-hidden border-y border-line bg-cream-deep">
      <div ref={fontProbeRef} aria-hidden className="hidden">
        <span data-font-display className="font-display">
          .
        </span>
      </div>
      <div
        className="absolute inset-0"
        onPointerDown={() => setHasMoved(true)}
        onKeyDown={() => setHasMoved(true)}
      >
        <CanvasStage>
          <Scene
            rooms={rooms}
            stage={stage}
            selectedIndex={selectedIndex}
            reduceMotion={reduceMotion}
            doorRequestToken={doorRequestToken}
            displayFont={fonts.display}
            sansFont={fonts.sans}
            onSelect={setSelectedIndex}
            onReachDoor={() => setStage((s) => (s === "room" ? "door" : s))}
            onDoorComplete={() => setStage("tryon")}
          />
        </CanvasStage>
      </div>

      {/* top chrome */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5">
        <div className="max-w-sm">
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display text-2xl text-ink">{t("title")}</h1>
        </div>
        <label className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-soft backdrop-blur-sm">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
          {t("reduceMotion")}
        </label>
      </div>

      {/* movement hint */}
      {stage === "room" && !hasMoved && (
        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 rounded-full border border-line bg-white/80 px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
          {t("hintMove")}
        </div>
      )}

      {/* selection info panel */}
      {stage === "room" && (
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5">
          <div className="min-w-[220px] border border-line bg-white/85 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              {selected ? t("kickerNearby") : t("kickerIdle")}
            </p>
            <p className="mt-1 font-display text-lg text-ink">{selected ? selected.title : "—"}</p>
            <p className="text-xs text-accent">{selected ? selected.priceLabel : ""}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={selected ? `/product/${selected.slug}` : "/shop"}
              aria-disabled={!selected}
              className="border border-ink px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-white aria-disabled:pointer-events-none aria-disabled:opacity-35"
            >
              {t("viewDetails")}
            </Link>
            <button
              type="button"
              disabled={!selected}
              onClick={() => setDoorRequestToken((n) => n + 1)}
              className="border border-accent bg-accent px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:shadow-[0_8px_20px_rgba(201,98,44,0.4)] disabled:pointer-events-none disabled:opacity-35"
            >
              {t("tryOnCta")}
            </button>
          </div>
        </div>
      )}

      {stage === "room" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
          <p className="rounded-full border border-line bg-white/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
            {t("promptDoor")}
          </p>
        </div>
      )}

      {/* try-on room */}
      {stage === "tryon" && (
        <div className="absolute inset-0 overflow-y-auto bg-cream-deep/95 px-6 py-10 text-center">
          <div className="mx-auto w-full max-w-xs">
            <p className="text-[11px] uppercase tracking-[0.15em] text-accent">{t("doorEyebrow")}</p>
            <h2 className="mt-2 font-display text-2xl text-ink">{t("doorTitle")}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {t("tryingOn")} <strong className="text-ink">{selected?.title ?? items[0]?.title}</strong>
            </p>
            <div className="mt-5">
              <TryOnStage item={selected ?? items[0] ?? null} />
            </div>
            <button
              type="button"
              onClick={() => setStage("room")}
              className="mt-6 border border-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
            >
              {t("backToRoom")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
