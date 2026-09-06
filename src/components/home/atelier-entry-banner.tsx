import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FilmGrainOverlay } from "@/components/atelier/film-grain-overlay";
import { MusubiIcon } from "@/components/atelier/musubi-icon";

export async function AtelierEntryBanner() {
  const t = await getTranslations("atelier");

  const features = [
    { href: "/atelier/explore", label: t("featureExplore") },
    { href: "/atelier/process", label: t("featureProcess") },
    { href: "/atelier/try-on", label: t("featureTryOn") },
  ] as const;

  return (
    <section className="relative overflow-hidden border-y border-line bg-cream-deep">
      <FilmGrainOverlay opacity={0.04} />
      <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          <MusubiIcon size={16} className="text-accent" />
          {t("eyebrow")}
        </div>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          {t("subtitle")}
        </p>
        <ul className="mt-7 flex flex-wrap justify-center gap-3">
          {features.map((feature) => (
            <li key={feature.href}>
              <Link
                href={feature.href}
                className="inline-flex items-center gap-1.5 border border-ink px-4 py-2 text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
              >
                {feature.label}
                <ArrowRight size={12} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
