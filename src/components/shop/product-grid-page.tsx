import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/products";

export function ProductGridPage({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
}) {
  const t = useTranslations("home");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            {subtitle}
          </p>
        )}
      </div>
      {products.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-soft">
          {t("newArrivalTag")}…
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
