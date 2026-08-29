import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProductBySlug, getProductsByCategory, formatPrice } from "@/lib/products";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductActions } from "@/components/shop/product-actions";
import { Accordion } from "@/components/shop/accordion";
import { ProductCard } from "@/components/shop/product-card";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const related = (await getProductsByCategory(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          title={product.title}
          imageCount={product.imageCount}
          imageUrls={product.imageUrls}
        />

        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-accent">
            {t("oneOfOne")}
          </p>
          <h1 className="mt-2 font-display text-3xl">{product.title}</h1>
          <p className="mt-2 text-lg">
            {formatPrice(product.priceCents, product.currency, locale)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{t("priceNote")}</p>
          <p className="mt-3 text-sm text-ink-soft">{t("onlyOneAvailable")}</p>

          <div className="mt-6">
            <ProductActions product={product} />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-6 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {t("condition")}
              </dt>
              <dd>{product.condition}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {t("materials")}
              </dt>
              <dd>{product.materials}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {t("era")}
              </dt>
              <dd>{product.era}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {t("origin")}
              </dt>
              <dd>{product.origin}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {t("measurements")}
              </dt>
              <dd>{product.measurements}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <Accordion
              items={[
                {
                  title: t("descriptionTitle"),
                  content: (
                    <div className="space-y-3">
                      {product.description.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  ),
                },
                {
                  title: t("detailsTitle"),
                  content: (
                    <p>
                      {product.condition} {product.materials}.
                    </p>
                  ),
                },
                {
                  title: t("shippingTitle"),
                  content: <p>{t("shippingBody")}</p>,
                },
                {
                  title: t("careTitle"),
                  content: <p>{t("careBody")}</p>,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-center font-display text-2xl">
            {t("relatedTitle")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
