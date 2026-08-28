"use client";

import { useLocale, useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { formatPrice, type Product } from "@/lib/products";
import { useWishlistStore } from "@/store/wishlist-store";
import clsx from "clsx";

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const has = useWishlistStore((s) => s.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <div className="group relative text-left">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative">
          <ImagePlaceholder
            label={`${product.title} — product photo`}
            aspect="aspect-[3/4]"
            className="transition-opacity group-hover:opacity-90"
          />
          {product.sold && (
            <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-white">
              {t("sold")}
            </span>
          )}
        </div>
      </Link>
      <button
        aria-label={has ? t("removeFromWishlist") : t("addToWishlist")}
        onClick={() => toggle(product.id)}
        className="absolute right-2 top-2 rounded-full bg-white/85 p-1.5"
      >
        <Heart size={16} className={clsx(has && "fill-accent text-accent")} />
      </button>
      <div className="mt-3 text-sm">
        <Link href={`/product/${product.slug}`} className="hover:text-accent">
          {product.title}
        </Link>
        <p className="mt-1 text-ink-soft">
          {formatPrice(product.priceCents, product.currency, locale)}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          {t("oneOfOne")}
        </p>
      </div>
    </div>
  );
}
