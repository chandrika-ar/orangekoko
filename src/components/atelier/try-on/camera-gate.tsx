import { ParchmentCard } from "@/components/atelier/parchment-card";

export function CameraGate({
  heading,
  note,
  buttonLabel,
  onAllow,
}: {
  heading: string;
  note: string;
  buttonLabel: string;
  onAllow: () => void;
}) {
  return (
    <div className="mx-auto max-w-xs text-center">
      <p className="font-display text-lg text-ink">{heading}</p>
      <ParchmentCard className="mt-4">
        <p className="text-sm leading-relaxed text-ink-soft">{note}</p>
        <button
          type="button"
          onClick={onAllow}
          className="mt-4 border border-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
        >
          {buttonLabel}
        </button>
      </ParchmentCard>
    </div>
  );
}
