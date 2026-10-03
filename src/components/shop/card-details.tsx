import { useLocale, useTranslations } from "next-intl";
import { availableQuantity } from "@/lib/commerce";
import type { Product } from "@/lib/products";

export function CardDetails({ product }: { product: Product }) {
  const t = useTranslations("cardShop");
  const locale = useLocale();
  const date = product.dispatchBy && /^\d{4}-\d{2}-\d{2}$/.test(product.dispatchBy)
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${product.dispatchBy}T00:00:00Z`)) : undefined;
  return (
    <div className="space-y-3 border-y border-line py-5 text-sm leading-relaxed">
      <p>{product.packSize === 3 ? t("three") : t("single")}</p>
      <p className="text-accent">{availableQuantity(product) === 0 ? t("outOfStock") : product.fulfilment === "preorder" ? t("preorder") : t("ready")}</p>
      {product.fulfilment === "preorder" && <p>{date ? t("dispatchBy", { date }) : t("dispatchMissing")}</p>}
      <p className="text-ink-soft">{t("minimumCards")}</p>
      {product.threeCardPriceCents && product.threeCardPriceCents < product.priceCents * 3 ? <p className="text-accent">{t("threeValue", { price: new Intl.NumberFormat(locale, { style: "currency", currency: product.currency }).format(product.threeCardPriceCents / 100) })}</p> : <p className="text-ink-soft">{t("threeValuePending")}</p>}
      <p className="text-ink-soft">{t("deliveryBody")}</p>
      {product.fulfilment === "preorder" && <p className="text-ink-soft">{t("mixedOrder")}</p>}
    </div>
  );
}
