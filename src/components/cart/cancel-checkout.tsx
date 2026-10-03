"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CancelCheckout({ reservationId }: { reservationId?: string }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cardShop");
  const [state, setState] = useState<"pending" | "released" | "error">(reservationId ? "pending" : "released");
  useEffect(() => {
    if (!reservationId) return;
    fetch("/api/checkout/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reservationId }) }).then((r) => setState(r.ok ? "released" : "error")).catch(() => setState("error"));
  }, [reservationId]);
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">{t("cancelTitle")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{state === "released" ? t("cancelBody") : state === "pending" ? tc("cancelPending") : tc("cancelFailed")}</p>
      {state === "released" && <Link href="/cart" className="mt-8 inline-block border border-ink px-6 py-2.5 text-sm hover:bg-ink hover:text-white">{t("backToShop")}</Link>}
      {state === "error" && <Link href="/contact" className="mt-8 inline-block border-b border-ink pb-1 text-sm">{tc("cancelHelp")}</Link>}
    </div>
  );
}
