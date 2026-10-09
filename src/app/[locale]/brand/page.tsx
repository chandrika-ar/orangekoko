import { getTranslations } from "next-intl/server";
import Image from "next/image";
import brandHero from "../../../../public/brand-gift-story.webp";
import jewelryCraft from "../../../../public/brand-jewelry-craft.webp";
import cardMaking from "../../../../public/brand-card-making.webp";

export default async function BrandPage() {
  const nav = await getTranslations("nav");
  const t = await getTranslations("brand");

  return (
    <div>
      <div className="relative aspect-[16/8] w-full overflow-hidden bg-cream-deep">
        <Image src={brandHero} alt="" fill priority placeholder="blur" className="object-cover" sizes="100vw" />
      </div>
      <header className="mx-auto max-w-2xl px-4 pt-16 pb-10 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">{nav("brand")}</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">{t("title")}</h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink-soft">{t("lead")}</p>
      </header>
      <div className="mx-auto max-w-2xl space-y-5 px-4 pb-12 text-base leading-relaxed text-ink-soft sm:px-6 lg:px-8">
        <p>{t("beginning1")}</p>
        <p>{t("beginning2")}</p>
      </div>
      <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-deep">
          <Image src={jewelryCraft} alt="" fill placeholder="blur" className="object-cover" sizes="(min-width: 1024px) 472px, (min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="space-y-5 text-base leading-relaxed text-ink-soft">
          <h2 className="font-display text-2xl text-ink">{t("aestheticsTitle")}</h2>
          <p>{t("aesthetics1")}</p>
          <p>{t("aesthetics2")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl space-y-5 px-4 py-12 text-base leading-relaxed text-ink-soft sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl text-ink">{t("craftTitle")}</h2>
        <p>{t("craft1")}</p>
        <p>{t("craft2")}</p>
        <p>{t("craft3")}</p>
      </section>
      <section className="mx-auto max-w-2xl space-y-5 px-4 py-8 text-base leading-relaxed text-ink-soft sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl text-ink">{t("givingTitle")}</h2>
        <p>{t("giving1")}</p>
        <p>{t("giving2")}</p>
      </section>
      <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="order-2 space-y-5 text-base leading-relaxed text-ink-soft md:order-1">
          <h2 className="font-display text-2xl text-ink">{t("whyCardsTitle")}</h2>
          <p>{t("cards1")}</p>
          <p>{t("cards2")}</p>
        </div>
        <div className="relative order-1 aspect-[4/5] w-full overflow-hidden bg-cream-deep md:order-2">
          <Image src={cardMaking} alt="" fill placeholder="blur" className="object-cover" sizes="(min-width: 1024px) 472px, (min-width: 768px) 50vw, 100vw" />
        </div>
      </section>
      <p className="mx-auto max-w-2xl px-4 pt-6 pb-16 text-center font-display text-xl italic leading-relaxed sm:px-6 lg:px-8">{t("closing")}</p>
    </div>
  );
}
