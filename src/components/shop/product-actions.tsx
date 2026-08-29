"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import clsx from "clsx";
import { useCartStore } from "@/store/cart-store";
import { useWishlist } from "@/lib/use-wishlist";
import type { Product } from "@/lib/products";

export function ProductActions({ product }: { product: Product }) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) =>
    s.lines.some((l) => l.productId === product.id),
  );
  const { has, toggle: toggleWishlist } = useWishlist();
  const hasWishlist = has(product.id);
  const [justAdded, setJustAdded] = useState(false);

  return (
    <div className="flex items-stretch gap-3">
      <button
        disabled={product.sold}
        onClick={() => {
          addItem({
            productId: product.id,
            slug: product.slug,
            title: product.title,
            priceCents: product.priceCents,
            currency: product.currency,
          });
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1800);
        }}
        className={clsx(
          "flex-1 border px-6 py-3.5 text-xs uppercase tracking-[0.12em] transition-colors",
          product.sold
            ? "cursor-not-allowed border-line text-ink-soft"
            : "border-ink bg-ink text-white hover:bg-transparent hover:text-ink",
        )}
      >
        {product.sold
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
