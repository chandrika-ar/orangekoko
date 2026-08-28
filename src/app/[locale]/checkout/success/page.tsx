"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutSuccessPage() {
  const t = useTranslations("checkout");
  const clear = useCartStore((s) => s.clear);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">{t("successTitle")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{t("successBody")}</p>
      <Link
        href="/"
        className="mt-8 inline-block border border-ink px-6 py-2.5 text-xs uppercase tracking-[0.12em] hover:bg-ink hover:text-white"
      >
        {t("backToShop")}
      </Link>
    </div>
  );
}
