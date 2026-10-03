import { getTranslations } from "next-intl/server";
import { getAllProducts, type Product } from "@/lib/products";
import { availableQuantity } from "@/lib/commerce";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { ProductActions } from "@/components/shop/product-actions";

export async function CrossSell({ product }: { product: Product }) {
 const t = await getTranslations("cardShop");
 const catalogue = await getAllProducts();
 const available = catalogue.filter(p => p.category === "handmade-cards" && (p.packSize ?? 1) === 1 && availableQuantity(p) > 0);
 const preferred = (product.recommendedCardIds ?? []).map(id => available.find(p => p.id === id)).filter((p): p is Product => Boolean(p));
 const matches = available.filter(p => p.projectTags?.some(tag => product.projectTags?.includes(tag)));
 const cards = [...new Map([...preferred, ...matches].map(p => [p.id,p])).values()].slice(0,3);
 return <section className="mt-16 border-t border-line pt-10"><h2 className="font-display text-2xl">{t("addCard")}</h2><p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{t("pairBody")}</p>
 {cards.length ? <div className="mt-8 grid gap-8 sm:grid-cols-3">{cards.map(p=><div key={p.id} className="space-y-4"><ProductCard product={p}/><ProductActions product={p}/></div>)}</div> : <p className="mt-6 text-sm text-ink-soft">{t("emptyPairing")}</p>}
 <Link href="/handmade-cards" className="mt-6 inline-block border-b border-ink pb-1 text-sm hover:text-accent">{t("browseCards")}</Link></section>;
}
