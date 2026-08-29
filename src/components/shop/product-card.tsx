"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { type Product } from "@/lib/products";
import { useDisplayPrice } from "@/lib/use-display-price";
import { useWishlist } from "@/lib/use-wishlist";
import clsx from "clsx";

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("product");
  const price = useDisplayPrice(product.priceCents, product.currency);
  const { has: hasWishlist, toggle } = useWishlist();
  const has = hasWishlist(product.id);
  const thumbnail = product.imageUrls?.[0];

  return (
    <div className="group relative text-left">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream-deep">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={product.title}
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
          ) : (
            <ImagePlaceholder
              label={`${product.title} — product photo`}
              aspect="aspect-[3/4]"
              className="absolute inset-0 transition-opacity group-hover:opacity-90"
            />
          )}
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
        <p className="mt-1 text-ink-soft">{price.formatted}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          {t("oneOfOne")}
        </p>
      </div>
    </div>
  );
}
