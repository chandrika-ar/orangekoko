import { FilmGrainOverlay } from "@/components/atelier/film-grain-overlay";

export function LoadingVeil() {
  return (
    <div className="relative flex h-[78vh] min-h-[560px] items-center justify-center overflow-hidden border-y border-line bg-cream-deep">
      <FilmGrainOverlay opacity={0.05} />
      <p className="relative text-[11px] uppercase tracking-[0.2em] text-ink-soft">
        Opening the room…
      </p>
    </div>
  );
}
