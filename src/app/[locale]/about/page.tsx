import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function AboutPage() {
  const footer = await getTranslations("footer");
  const t = await getTranslations("about");

  return (
    <div>
      <div className="relative aspect-[16/7] w-full overflow-hidden bg-cream-deep">
        <Image src="/about-studio-story.webp" alt="" fill priority className="object-cover" sizes="100vw" />
      </div>
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">{footer("ourStory")}</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="mt-6 text-base leading-relaxed text-ink-soft">{t("lead")}</p>
        </header>
        <div className="mt-10 space-y-10 text-base leading-relaxed text-ink-soft">
          <section className="space-y-5">
            <h2 className="font-display text-2xl text-ink">{t("discoveryTitle")}</h2>
            <p>{t("discovery1")}</p>
            <p>{t("discovery2")}</p>
          </section>
          <section className="space-y-5">
            <h2 className="font-display text-2xl text-ink">{t("selectionTitle")}</h2>
            <p>{t("selection1")}</p>
            <p>{t("selection2")}</p>
          </section>
          <section className="space-y-5">
            <h2 className="font-display text-2xl text-ink">{t("cardsTitle")}</h2>
            <p>{t("cards1")}</p>
            <p>{t("cards2")}</p>
          </section>
          <section className="space-y-5">
            <h2 className="font-display text-2xl text-ink">{t("promiseTitle")}</h2>
            <p>{t("promise1")}</p>
            <p>{t("promise2")}</p>
          </section>
        </div>
        <p className="mt-12 text-center font-display text-xl italic leading-relaxed">{t("closing")}</p>
      </article>
    </div>
  );
}
