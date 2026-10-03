import { useTranslations } from "next-intl";

export function CardDelivery() {
  const t = useTranslations("cardShop");
  return (
    <aside className="mt-12 border border-line bg-cream-deep p-6 sm:p-8">
      <h2 className="font-display text-2xl">{t("deliveryTitle")}</h2>
      <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed text-ink-soft">
        <p>{t("minimumCards")}</p>
        <p>{t("deliveryBody")}</p>
        <p>{t("ratePending")}</p>
        <p>{t("mixedOrder")}</p>
      </div>
    </aside>
  );
}
