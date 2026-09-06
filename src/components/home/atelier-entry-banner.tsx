import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WaxSeal } from "@/components/atelier/wax-seal";
import { FilmGrainOverlay } from "@/components/atelier/film-grain-overlay";
import { MusubiIcon } from "@/components/atelier/musubi-icon";

export async function AtelierEntryBanner() {
  const t = await getTranslations("atelier");

  return (
    <section className="relative overflow-hidden border-y border-line bg-cream-deep">
      <FilmGrainOverlay opacity={0.04} />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 text-center sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8 lg:text-left">
        <div>
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft lg:justify-start">
            <MusubiIcon size={16} className="text-accent" />
            {t("eyebrow")}
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">{t("title")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft lg:mx-0">
            {t("subtitle")}
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.1em] text-ink-soft lg:justify-start">
            <li>
              <Link
                href="/atelier/explore"
                className="border-b border-transparent pb-0.5 transition-colors hover:border-ink hover:text-ink"
              >
                {t("featureExplore")}
              </Link>
            </li>
            <li>
              <Link
                href="/atelier/process"
                className="border-b border-transparent pb-0.5 transition-colors hover:border-ink hover:text-ink"
              >
                {t("featureProcess")}
              </Link>
            </li>
            <li>
              <Link
                href="/atelier/try-on"
                className="border-b border-transparent pb-0.5 transition-colors hover:border-ink hover:text-ink"
              >
                {t("featureTryOn")}
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3 justify-self-center">
          <WaxSeal href="/atelier" label={t("cta")} size={104} />
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("cta")}
          </span>
        </div>
      </div>
    </section>
  );
}
