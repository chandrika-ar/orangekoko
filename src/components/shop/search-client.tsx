"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/products";

export function SearchClient({ allProducts }: { allProducts: Product[] }) {
  const t = useTranslations("nav");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter((p) => p.title.toLowerCase().includes(q));
  }, [query, allProducts]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search")}
        className="w-full border-b border-ink bg-transparent py-3 text-xl font-display focus:outline-none"
      />
      {query && (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
