import { getTranslations } from "next-intl/server";
import Image from "next/image";
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
    <section className="relative flex min-h-[520px] items-center overflow-hidden border-y border-line py-20 text-center">
      <Image
        src="/brand-parasol.jpg"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
      <FilmGrainOverlay opacity={0.07} />
      <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent-soft">
          <MusubiIcon size={16} />
          {t("eyebrow")}
        </div>
        <h2 className="mt-4 font-display text-4xl text-white sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/80">
          {t("subtitle")}
        </p>
        <ul className="mt-9 flex flex-wrap justify-center gap-4">
          {features.map((feature) => (
            <li key={feature.href}>
              <Link
                href={feature.href}
                className="group inline-flex items-center gap-2 border border-white/70 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:shadow-[0_8px_20px_rgba(201,98,44,0.45)]"
              >
                {feature.label}
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
