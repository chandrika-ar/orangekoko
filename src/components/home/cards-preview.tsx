import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function CardsPreview() {
  const t = useTranslations("cards");

  return (
    <section className="border-y border-line bg-cream px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_1fr] md:items-center md:gap-16">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-ink-soft">{t("eyebrow")}</p>
          <h2 className="mt-3 max-w-lg font-display text-3xl leading-snug sm:text-4xl">{t("title")}</h2>
        </div>
        <div>
          <p className="max-w-lg text-base leading-relaxed text-ink-soft">{t("previewBody")}</p>
          <Link href="/handmade-cards" className="mt-6 inline-flex items-center gap-2 border-b border-ink pb-1 text-sm hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4">
            {t("cta")} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
