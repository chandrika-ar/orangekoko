import { getTranslations } from "next-intl/server";
import { getAllProducts } from "@/lib/products";
import { availableQuantity } from "@/lib/commerce";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { ProductActions } from "@/components/shop/product-actions";
import { CardDetails } from "@/components/shop/card-details";

export async function CrossSell({ cards, excludeId }: { cards: boolean; excludeId?: string }) {
  const t = await getTranslations("cardShop");
  const products = (await getAllProducts()).filter((p) => p.id !== excludeId && (p.category === "handmade-cards") === cards && availableQuantity(p) > 0).slice(0, 3);
  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="font-display text-2xl">{cards ? t("addCard") : t("addJewelry")}</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{t("pairBody")}</p>
      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {products.map((p) => <div key={p.id} className="space-y-4"><ProductCard product={p} />{p.category === "handmade-cards" && <CardDetails product={p} />}<ProductActions product={p} /></div>)}
        </div>
      ) : <p className="mt-6 text-sm text-ink-soft">{t("emptyPairing")}</p>}
      <Link href={cards ? "/handmade-cards" : "/jewelry"} className="mt-6 inline-block border-b border-ink pb-1 text-sm hover:text-accent">{cards ? t("browseCards") : t("browseJewelry")}</Link>
    </section>
  );
}
