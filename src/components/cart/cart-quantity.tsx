"use client";
import { useTranslations } from "next-intl";
import { type CartLine, useCartStore } from "@/store/cart-store";

export function CartQuantity({ line }: { line: CartLine }) {
  const t = useTranslations("cart");
  const setQuantity = useCartStore((s) => s.setQuantity);
  return <label className="mt-2 flex items-center gap-2 text-sm"><span>{t("quantity")}</span><input type="number" min={1} max={line.maxQuantity ?? 1} value={line.quantity} onChange={(e) => setQuantity(line.productId, Number(e.target.value))} className="w-16 border border-line bg-cream px-2 py-1" /></label>;
}
