"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lines.length === 0) {
      router.replace("/cart");
      return;
    }

    let cancelled = false;
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slugs: lines.map((l) => l.slug),
        locale,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Checkout failed");
        if (!cancelled) window.location.href = data.url;
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => router.replace("/cart")}
            className="mt-4 border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
          >
            {t("continueShopping")}
          </button>
        </>
      ) : (
        <p className="text-sm text-ink-soft">{t("checkout")}…</p>
      )}
    </div>
  );
}
