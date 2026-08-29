"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/products";
import { useWishlist } from "@/lib/use-wishlist";

export function WishlistClient({ allProducts }: { allProducts: Product[] }) {
  const t = useTranslations("wishlist");
  const { productIds } = useWishlist();
  const saved = allProducts.filter((p) => productIds.includes(p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-center font-display text-3xl">{t("title")}</h1>
      {saved.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p>{t("empty")}</p>
          <p className="text-sm text-ink-soft">{t("emptyBody")}</p>
          <Link
            href="/new-arrivals"
            className="mt-4 border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
          >
            {t("moveToBag")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
