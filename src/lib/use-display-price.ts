"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useCurrencyRates } from "@/components/currency-provider";
import { CURRENCY_BY_LOCALE, convertCents } from "@/lib/currency";
import { formatPrice } from "@/lib/products";

/**
 * Converts a EUR-denominated price into the visitor's local currency for
 * display only — Stripe checkout still always charges in EUR.
 */
export function useDisplayPrice(cents: number, baseCurrency: string) {
  const locale = useLocale() as Locale;
  const rates = useCurrencyRates();
  const targetCurrency = CURRENCY_BY_LOCALE[locale] ?? baseCurrency;
  const convertedCents = convertCents(cents, baseCurrency, targetCurrency, rates);
  return {
    formatted: formatPrice(convertedCents, targetCurrency, locale),
    isConverted: targetCurrency !== baseCurrency,
  };
}
