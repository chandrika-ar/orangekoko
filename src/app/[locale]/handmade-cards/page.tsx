import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cards" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function HandmadeCardsPage() {
  const t = await getTranslations("cards");

  return (
    <section className="flex min-h-[65vh] items-center bg-cream px-6 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="text-sm uppercase tracking-[0.15em] text-ink-soft">{t("eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
        <div className="mx-auto mt-8 max-w-xl space-y-4 text-base leading-relaxed text-ink-soft">
          <p>{t("intro")}</p>
          <p className="border-t border-line pt-6">{t("empty")}</p>
        </div>
        <Link href="/new-arrivals" className="mt-10 inline-block border border-ink px-6 py-3 text-sm transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4">
          {t("jewelryCta")}
        </Link>
      </div>
    </section>
  );
}
