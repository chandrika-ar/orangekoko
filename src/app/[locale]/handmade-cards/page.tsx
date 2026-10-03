import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/shop/product-card";
import { CrossSell } from "@/components/shop/cross-sell";
import { CardDelivery } from "@/components/shop/card-delivery";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cards" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function HandmadeCardsPage() {
  const t = await getTranslations("cards");
  const ts = await getTranslations("cardShop");
  const cards = await getProductsByCategory("handmade-cards");
  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.15em] text-accent">{t("eyebrow")}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-6 text-base leading-relaxed text-ink-soft">{t("intro")}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[{ href: "#single", title: "single", body: "singleBody" }, { href: "#sets", title: "three", body: "threeBody" }, { href: "/jewelry", title: "withJewelry", body: "withJewelryBody" }].map((mode) => (
          <Link key={mode.title} href={mode.href} className="border border-line bg-cream-deep p-6 transition-colors hover:border-accent">
            <h2 className="font-display text-xl">{ts(mode.title)}</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">{ts(mode.body)}</p>
          </Link>
        ))}
      </div>
      {[{ id: "single", size: 1, title: "single" }, { id: "sets", size: 3, title: "three" }].map((section) => {
        const pieces = cards.filter((p) => (p.packSize ?? 1) === section.size);
        return <section key={section.id} id={section.id} className="mt-12 scroll-mt-32"><h2 className="font-display text-2xl">{ts(section.title)}</h2>{pieces.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">{pieces.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <p className="mt-5 text-sm text-ink-soft">{t("empty")}</p>}</section>;
      })}
      <CardDelivery />
      <CrossSell cards={false} />
    </div>
  );
}
