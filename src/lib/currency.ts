import type { Locale } from "@/i18n/routing";

// Real currency used in each locale's associated country. Nordic
// currencies differ from the Eurozone even though Stripe checkout still
// bills everyone in EUR for now — this map only drives what price is
// *displayed* while browsing.
export const CURRENCY_BY_LOCALE: Record<Locale, string> = {
  en: "EUR",
  de: "EUR",
  fr: "EUR",
  nl: "EUR",
  es: "EUR",
  it: "EUR",
  sv: "SEK",
  da: "DKK",
  no: "NOK",
  fi: "EUR",
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "EUR €",
  SEK: "SEK kr",
  DKK: "DKK kr",
  NOK: "NOK kr",
};

// Used only if the live rate fetch below fails — approximate, EUR-based.
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  SEK: 11.2,
  DKK: 7.46,
  NOK: 11.6,
};

const CACHE_MS = 12 * 60 * 60 * 1000;
let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;

/** Server-only: fetches EUR-based exchange rates, cached ~12h. Never throws. */
export async function getExchangeRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.rates;
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=SEK,DKK,NOK",
      { next: { revalidate: 43200 } },
    );
    if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`);
    const data = (await res.json()) as { rates: Record<string, number> };
    const rates = { EUR: 1, ...data.rates };
    cache = { rates, fetchedAt: Date.now() };
    return rates;
  } catch (err) {
    console.error("Falling back to static exchange rates", err);
    return FALLBACK_RATES;
  }
}

export function convertCents(
  cents: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  if (fromCurrency === toCurrency) return cents;
  const rate = rates[toCurrency];
  if (!rate) return cents;
  return Math.round(cents * rate);
}
