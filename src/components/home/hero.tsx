import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("hero");
  const cards = useTranslations("cardShop");
  return (
    <section className="grid bg-cream-deep lg:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 sm:py-16 lg:py-24">
        <p className="text-sm uppercase tracking-[0.15em] text-accent">Created &amp; Curated</p>
        <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl xl:text-6xl">{t("titleLine1")}<br /><span className="italic">{t("titleLine2")}</span></h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">{t("subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/jewelry" className="border border-ink bg-ink px-5 py-3 text-sm text-white transition-colors hover:bg-accent">{cards("browseJewelry")}</Link>
          <Link href="/handmade-cards" className="border border-ink bg-ink px-5 py-3 text-sm text-white transition-colors hover:bg-accent">{cards("browseCards")}</Link>
        </div>
      </div>
      <figure className="relative m-0">
        <div className="relative aspect-[3/2] lg:aspect-auto lg:h-full lg:min-h-[560px]">
          <Image src="/created-curated-hero.webp" alt={cards("heroAlt")} fill priority className="object-cover" sizes="(min-width: 1024px) 58vw, 100vw" />
        </div>
      </figure>
    </section>
  );
}
