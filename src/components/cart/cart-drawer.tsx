"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cartSubtotalCents, useCartStore } from "@/store/cart-store";
import { useDisplayPrice } from "@/lib/use-display-price";

function LinePrice({ cents, currency }: { cents: number; currency: string }) {
  return <>{useDisplayPrice(cents, currency).formatted}</>;
}

export function CartDrawer() {
  const t = useTranslations("cart");
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);
  const removeItem = useCartStore((s) => s.removeItem);

  if (!isOpen) return null;

  const subtotal = cartSubtotalCents(lines);
  const currency = lines[0]?.currency ?? "EUR";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label={t("title")}
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg">{t("title")}</h2>
          <button aria-label="Close" onClick={close}>
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p>{t("empty")}</p>
            <p className="text-sm text-ink-soft">{t("emptyBody")}</p>
            <Link
              href="/new-arrivals"
              onClick={close}
              className="mt-4 border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
            >
              {t("continueShopping")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-line px-5">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-center gap-4 py-4">
                  <div className="image-placeholder h-20 w-16 shrink-0">
                    <span className="px-1 text-center text-[9px] uppercase">
                      photo
                    </span>
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/product/${line.slug}`}
                      onClick={close}
                      className="text-sm hover:text-accent"
                    >
                      {line.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      <LinePrice cents={line.priceCents} currency={line.currency} />
                    </p>
                    <button
                      onClick={() => removeItem(line.productId)}
                      className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink-soft underline"
                    >
                      {t("remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span><LinePrice cents={subtotal} currency={currency} /></span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{t("shippingNote")}</p>
              <p className="mt-1 text-xs text-ink-soft">{t("billedInEur")}</p>
              <Link
                href="/checkout"
                onClick={close}
                className="mt-4 block w-full bg-ink py-3.5 text-center text-xs uppercase tracking-[0.12em] text-white hover:bg-accent"
              >
                {t("checkout")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
