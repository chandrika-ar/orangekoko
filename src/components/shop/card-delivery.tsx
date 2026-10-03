import { Link } from "@/i18n/navigation";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/products";
import { useLocale, useTranslations } from "next-intl";

export function CardDelivery() {
  const t = useTranslations("cardShop");
  const shipping = useTranslations("shippingPage");
  const footer = useTranslations("footer");
  const locale = useLocale();
  const amount = formatPrice(FREE_SHIPPING_THRESHOLD_CENTS, "EUR", locale);
  return (
    <aside className="mt-12 border border-line bg-cream-deep p-6 sm:p-8">
      <h2 className="font-display text-2xl">{t("deliveryTitle")}</h2>
      <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed text-ink-soft">
        <p>{t("minimumCards")}</p>
        <p>{t("deliveryBody")}</p>
        <p>{shipping("freeBody", { amount })}</p>
        <Link href="/shipping" className="inline-block border-b border-ink pb-1 text-sm hover:text-accent">{footer("shipping")}</Link>
        <p>{t("mixedOrder")}</p>
      </div>
    </aside>
  );
}
