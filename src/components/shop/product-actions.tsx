"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { availableQuantity } from "@/lib/commerce";
import clsx from "clsx";
import { useCartStore } from "@/store/cart-store";
import { useWishlist } from "@/lib/use-wishlist";
import type { Product } from "@/lib/products";

export function ProductActions({ product }: { product: Product }) {
  const t = useTranslations("product");
  const cart = useTranslations("cart");
  const [quantity, setQuantity] = useState(1);
  const available = availableQuantity(product);
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) =>
    s.lines.some((l) => l.productId === product.id),
  );
  const { has, toggle: toggleWishlist } = useWishlist();
  const hasWishlist = has(product.id);
  const [justAdded, setJustAdded] = useState(false);

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      {product.category === "handmade-cards" && available > 0 && <label className="flex items-center gap-2 text-sm"><span>{cart("quantity")}</span><input type="number" min={1} max={available} value={quantity} onChange={event=>setQuantity(Math.max(1, Math.min(available, Number(event.target.value) || 1)))} className="w-16 border border-line bg-cream px-2 py-3" /></label>}
      <button
        disabled={available === 0}
        onClick={() => {
          addItem({
            category: product.category,
            packSize: product.packSize,
            threeCardPriceCents: product.category === "handmade-cards" ? product.threeCardPriceCents : undefined,
            productId: product.id,
            slug: product.slug,
            title: product.title,
            priceCents: product.priceCents,
            currency: product.currency,
            maxQuantity: available,
            dispatchBy: product.fulfilment === "preorder" ? product.dispatchBy : undefined,
          }, quantity);
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1800);
        }}
        className={clsx(
          "flex-1 border px-6 py-3.5 text-xs uppercase tracking-[0.12em] transition-colors",
          available === 0
            ? "cursor-not-allowed border-line text-ink-soft"
            : "border-ink bg-ink text-white hover:bg-transparent hover:text-ink",
        )}
      >
        {available === 0
          ? t("sold")
          : inCart || justAdded
            ? t("addedToBag")
            : t("addToBag")}
      </button>
      <button
        aria-label={
          hasWishlist ? t("removeFromWishlist") : t("addToWishlist")
        }
        onClick={() => toggleWishlist(product.id)}
        className="flex items-center justify-center border border-ink px-4"
      >
        <Heart size={18} className={clsx(hasWishlist && "fill-accent text-accent")} />
      </button>
    </div>
  );
}
