"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { FilmGrainOverlay } from "./film-grain-overlay";

const STEPS = ["arrive", "clean", "inspect", "wrap", "seal"] as const;
type Step = (typeof STEPS)[number];

function stepCaptionKey(step: Step): `${Step}Caption` {
  return `${step}Caption`;
}

function stepLabelKey(step: Step): `${Step}Label` {
  return `${step}Label`;
}

export function ProcessFilmstrip({ className }: { className?: string }) {
  const t = useTranslations("process");
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  return (
    <div className={clsx("mx-auto w-full max-w-sm", className)}>
      <div className="relative border-[3px] border-ink bg-ink px-5 py-2">
        <FilmGrainOverlay opacity={0.08} />
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <ImagePlaceholder
            label={`Process — ${step} — photo coming soon`}
            aspect="aspect-[4/5]"
            className="h-full"
          />
        </div>
      </div>

      <p className="mt-4 min-h-[3.5rem] text-center font-display text-lg italic leading-snug">
        {t(stepCaptionKey(step))}
      </p>

      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={t("previous")}
          onClick={() => setIndex((i) => (i - 1 + STEPS.length) % STEPS.length)}
          className="p-2 text-ink-soft transition-colors hover:text-accent"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              aria-label={t(stepLabelKey(s))}
              onClick={() => setIndex(i)}
              className={clsx(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index ? "bg-accent" : "bg-line",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={t("next")}
          onClick={() => setIndex((i) => (i + 1) % STEPS.length)}
          className="p-2 text-ink-soft transition-colors hover:text-accent"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
