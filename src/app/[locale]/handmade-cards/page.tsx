import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/shop/product-card";
import { CardDelivery } from "@/components/shop/card-delivery";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
 const { locale } = await params; const t = await getTranslations({ locale, namespace: "cards" });
 return { title: t("metaTitle"), description: t("metaDescription") };
}
export default async function HandmadeCardsPage() {
 const t = await getTranslations("cards");
 const cards = (await getProductsByCategory("handmade-cards")).filter(p => (p.packSize ?? 1) === 1);
 return <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
   <div className="max-w-2xl"><p className="text-sm uppercase tracking-[0.15em] text-accent">{t("eyebrow")}</p><h1 className="mt-4 font-display text-4xl sm:text-5xl">{t("title")}</h1><p className="mt-6 text-base leading-relaxed text-ink-soft">{t("intro")}</p></div>
   {cards.length ? <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">{cards.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <p className="mt-10 text-sm text-ink-soft">{t("empty")}</p>}
   <CardDelivery />
 </div>;
}
