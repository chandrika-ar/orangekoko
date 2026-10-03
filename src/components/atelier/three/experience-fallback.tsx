import { Link } from "@/i18n/navigation";
import { ParchmentCard } from "@/components/atelier/parchment-card";

export function ExperienceFallback({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl">{title}</h1>
      <ParchmentCard className="mx-auto mt-8">
        <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
      </ParchmentCard>
      <Link
        href="/shop"
        className="mt-8 inline-block border-b border-ink pb-0.5 text-[11px] uppercase tracking-[0.1em]"
      >
        {cta}
      </Link>
    </div>
  );
}
