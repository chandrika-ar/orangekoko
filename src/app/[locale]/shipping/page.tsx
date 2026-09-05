import { getTranslations, getLocale } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";
import { computeShippingOptions, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPABLE_COUNTRIES } from "@/lib/shipping";
import { formatPrice } from "@/lib/products";

export default async function ShippingPage() {
  const t = await getTranslations("footer");
  const ts = await getTranslations("shippingPage");
  const locale = await getLocale();

  const [standard, express] = computeShippingOptions(0);
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });
  const countryNames = [...SHIPPABLE_COUNTRIES]
    .map((code) => regionNames.of(code) ?? code)
    .sort((a, b) => a.localeCompare(b, locale));
  const freeThreshold = formatPrice(FREE_SHIPPING_THRESHOLD_CENTS, "EUR", locale);

  return (
    <SimplePage title={t("shipping")}>
      <p>{ts("intro")}</p>

      <div className="border border-line p-4">
        <p className="font-display text-lg text-ink">{ts("freeTitle", { amount: freeThreshold })}</p>
        <p className="mt-1">
          {ts("freeBody", { amount: freeThreshold })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="font-display text-lg text-ink">{ts("standardName")}</p>
          <p className="mt-1 text-ink">{formatPrice(standard.amountCents, "EUR", locale)}</p>
          <p>{ts("daysRange", { min: standard.minDays, max: standard.maxDays })}</p>
        </div>
        <div>
          <p className="font-display text-lg text-ink">{ts("expressName")}</p>
          <p className="mt-1 text-ink">{formatPrice(express.amountCents, "EUR", locale)}</p>
          <p>{ts("daysRange", { min: express.minDays, max: express.maxDays })}</p>
        </div>
      </div>

      <h2 className="font-display text-lg text-ink">{ts("countriesTitle")}</h2>
      <p>{countryNames.join(", ")}</p>

      <p className="text-xs text-ink-soft">{ts("note")}</p>
    </SimplePage>
  );
}
