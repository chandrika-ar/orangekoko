"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { CanvasStage } from "@/components/atelier/three/canvas-stage";
import { ExperienceFallback } from "@/components/atelier/three/experience-fallback";
import { useWebglSupport } from "@/components/atelier/three/use-webgl-support";
import { TryOnStage } from "@/components/atelier/try-on/try-on-stage";
import { TryOnSwitcher } from "@/components/atelier/try-on/try-on-switcher";
import type { CategoryRoom } from "./get-journey-items";
import { Scene } from "./scene";
import type { JourneyItem, JourneyStage } from "./types";

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
  // Locked in when "try this piece on" is clicked, so whatever she happens
  // to be nearest to along the walk to the door doesn't change what she's
  // actually trying on — that's only allowed to change via the switcher
  // once she's through the door.
  const [tryOnItem, setTryOnItem] = useState<JourneyItem | null>(null);

  // The ring cards draw their own labels onto a canvas texture rather than
  // fetching a font at runtime (see card-texture.ts), so they need the site's
  // actual computed font stacks, read off real DOM elements using those classes.
  const fontProbeRef = useRef<HTMLDivElement>(null);
  // Positioned every frame by Scene (see its anchorRef prop) to track the
  // nearest card's on-screen projection — a plain ref rather than React
  // state so the panel can follow the card at frame rate without a
  // per-frame re-render, using the same imperative pattern the 3D scene
  // itself uses for its lights and door animation.
  const anchorRef = useRef<HTMLDivElement>(null);
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
  const worn = selected ?? items[0] ?? null;
  // Falls back to `worn` for the walk-straight-to-the-door-herself path,
  // where there was no button click to lock anything in.
  const shown = tryOnItem ?? worn;

  function requestTryOn(item: JourneyItem) {
    setTryOnItem(item);
    setDoorRequestToken((n) => n + 1);
  }

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
            anchorRef={anchorRef}
          />
        </CanvasStage>
      </div>

      {/* "nearby item" callout — positioned every frame by Scene (via
          anchorRef) to sit right above whatever card she's standing at,
          with a tail pointing straight down at it, so it reads as a
          contextual game prompt rather than a fixed corner button
          disconnected from what it acts on */}
      {stage === "room" && selected && (
        <div
          ref={anchorRef}
          className="absolute flex w-[210px] -translate-x-1/2 -translate-y-[calc(100%+14px)] flex-col items-stretch gap-2 rounded-sm border border-line bg-white/95 p-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
        >
          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-line bg-white/95" />
          <div className="flex items-center gap-2">
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- small fixed-size overlay thumbnail in a screen-tracked callout, not a page image
              <img
                src={selected.imageUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-sm border border-line object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.14em] text-ink-soft">{t("kickerNearby")}</p>
              <p className="truncate font-display text-sm leading-tight text-ink">{selected.title}</p>
              <p className="text-xs text-accent">{selected.priceLabel}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/product/${selected.slug}`}
              className="flex-1 border border-ink px-2 py-1.5 text-center text-[9px] uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-white"
            >
              {t("viewDetails")}
            </Link>
            <button
              type="button"
              onClick={() => requestTryOn(selected)}
              className="flex-1 border border-accent bg-accent px-2 py-1.5 text-[9px] uppercase tracking-[0.1em] text-white shadow-[0_0_0_3px_rgba(201,98,44,0.25)] transition-colors hover:shadow-[0_0_0_4px_rgba(201,98,44,0.35)]"
            >
              {t("tryOnCta")}
            </button>
          </div>
        </div>
      )}

      {/* top chrome */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5">
        <div className="max-w-sm rounded-sm border border-line bg-white/80 px-3 py-2 backdrop-blur-sm">
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

      {/* try-on room */}
      {stage === "tryon" && (
        <div className="absolute inset-0 overflow-y-auto bg-cream-deep/95 px-6 py-10 text-center">
          <div className="mx-auto w-full max-w-xs">
            <p className="text-[11px] uppercase tracking-[0.15em] text-accent">{t("doorEyebrow")}</p>
            <h2 className="mt-2 font-display text-2xl text-ink">{t("doorTitle")}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {t("tryingOn")} <strong className="text-ink">{shown?.title}</strong>
            </p>
            <div className="mt-5">
              <TryOnStage item={shown} />
            </div>
            {shown && <TryOnSwitcher rooms={rooms} current={shown} onSelect={setTryOnItem} />}
            <button
              type="button"
              onClick={() => {
                setTryOnItem(null);
                setStage("room");
              }}
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
