import { getLocale, getTranslations } from "next-intl/server";
import { getAllProducts, formatPrice } from "@/lib/products";
import { availableQuantity } from "@/lib/commerce";
import { TryOnPicker } from "@/components/shop/try-on-picker";
import type { JourneyItem } from "@/components/atelier/journey/types";

export default async function TryOnPage() {
 const t=await getTranslations("atelierPage"); const locale=await getLocale();
 const items: JourneyItem[]=(await getAllProducts()).flatMap(product=>product.category === "handmade-cards" || !product.imageUrls?.[0] || availableQuantity(product) === 0 ? [] : [{slug:product.slug,title:product.title,category:product.category,priceLabel:formatPrice(product.priceCents,product.currency,locale),imageUrl:product.imageUrls[0]}]);
 return <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20"><h1 className="font-display text-4xl">{t("tryOnTitle")}</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">{t("tryOnBody")}</p><TryOnPicker items={items}/></main>;
}
