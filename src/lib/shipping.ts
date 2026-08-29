/**
 * MVP shipping model: flat-rate, weight-agnostic (all pieces are small,
 * lightweight jewelry shipped in padded mailers, well under Japan Post's
 * small-packet weight brackets).
 *
 * Phase 2: replace `computeShippingOptions` with a live rate call to a
 * carrier/aggregator (Japan Post international API, or an aggregator like
 * Sendcloud / EasyPost / Shippo that supports Japan Post EMS, e-packet,
 * Yu-Pack, and can also purchase & print the export label). Until that's
 * wired up, fulfil orders manually via the Japan Post international
 * counter or e-packet online shipping tool.
 */

export const SHIPPABLE_COUNTRIES = [
  // EU member states
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // Nordic / nearby Europe, non-EU
  "NO", "IS", "CH", "GB",
] as const;

export const FREE_SHIPPING_THRESHOLD_CENTS = 12000; // €120, matches homepage banner

interface ShippingOption {
  id: string;
  labelKey: "standardTracked" | "expressInsured";
  amountCents: number;
  minDays: number;
  maxDays: number;
}

const BASE_OPTIONS: ShippingOption[] = [
  {
    id: "standard-tracked",
    labelKey: "standardTracked",
    amountCents: 990,
    minDays: 6,
    maxDays: 12,
  },
  {
    id: "express-insured",
    labelKey: "expressInsured",
    amountCents: 2490,
    minDays: 3,
    maxDays: 6,
  },
];

export function computeShippingOptions(subtotalCents: number) {
  const qualifiesForFree = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;

  return BASE_OPTIONS.map((option) => ({
    ...option,
    amountCents:
      qualifiesForFree && option.id === "standard-tracked"
        ? 0
        : option.amountCents,
  }));
}

export function toStripeShippingOptions(subtotalCents: number) {
  return computeShippingOptions(subtotalCents).map((option) => ({
    shipping_rate_data: {
      type: "fixed_amount" as const,
      fixed_amount: { amount: option.amountCents, currency: "eur" },
      display_name:
        option.labelKey === "standardTracked"
          ? "Standard tracked (Japan Post e-packet)"
          : "Express insured (Japan Post EMS)",
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: option.minDays },
        maximum: { unit: "business_day" as const, value: option.maxDays },
      },
    },
  }));
}
