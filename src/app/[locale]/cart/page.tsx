"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cartSubtotalCents, useCartStore } from "@/store/cart-store";
import { useDisplayPrice } from "@/lib/use-display-price";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/products";
import { useLocale } from "next-intl";

function LinePrice({ cents, currency }: { cents: number; currency: string }) {
  return <>{useDisplayPrice(cents, currency).formatted}</>;
}

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const lines = useCartStore((s) => s.lines);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = cartSubtotalCents(lines);
  const currency = lines[0]?.currency ?? "EUR";
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl">{t("title")}</h1>

      {lines.length === 0 ? (
        <div className="mt-8 flex flex-col items-start gap-2">
          <p>{t("empty")}</p>
          <p className="text-sm text-ink-soft">{t("emptyBody")}</p>
          <Link
            href="/new-arrivals"
            className="mt-4 border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-5 py-5">
                <div className="image-placeholder h-24 w-20 shrink-0">
                  <span className="px-1 text-center text-[9px] uppercase">
                    photo
                  </span>
                </div>
                <div className="flex-1">
                  <Link href={`/product/${line.slug}`} className="hover:text-accent">
                    {line.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">
                    <LinePrice cents={line.priceCents} currency={line.currency} />
                  </p>
                </div>
                <button
                  onClick={() => removeItem(line.productId)}
                  className="text-[11px] uppercase tracking-[0.08em] text-ink-soft underline"
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between text-lg">
            <span>{t("subtotal")}</span>
            <span><LinePrice cents={subtotal} currency={currency} /></span>
          </div>
          <p className="mt-3 text-xs text-accent">
            {remainingForFreeShipping > 0
              ? t("freeShippingProgress", {
                  amount: formatPrice(remainingForFreeShipping, "EUR", locale),
                })
              : t("freeShippingUnlocked")}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{t("shippingNote")}</p>
          <p className="mt-1 text-xs text-ink-soft">{t("billedInEur")}</p>
          <Link
            href="/checkout"
            className="mt-6 block w-full max-w-xs bg-ink py-3.5 text-center text-xs uppercase tracking-[0.12em] text-white hover:bg-accent sm:inline-block"
          >
            {t("checkout")}
          </Link>
        </>
      )}
    </div>
  );
}
