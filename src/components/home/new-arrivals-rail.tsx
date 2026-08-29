import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { getAllProducts, type Product } from "@/lib/products";
import Image from "next/image";

export async function NewArrivalsRail() {
  const t = await getTranslations("home");
  const found = (await getAllProducts()).slice(0, 5);
  const slots: (Product | null)[] =
    found.length > 0 ? found : Array.from({ length: 5 }, () => null);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h2 className="font-display text-3xl">{t("newArrivalsTitle")}</h2>
      <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
        {t("newArrivalsSubtitle")}
      </p>
      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((product, i) => {
          const thumbnail = product?.imageUrls?.[0];
          return (
            <Link
              key={product?.id ?? i}
              href={product ? `/product/${product.slug}` : "/new-arrivals"}
              className="group block text-left"
            >
              {thumbnail ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream-deep">
                  <Image
                    src={thumbnail}
                    alt={product!.title}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-90"
                    sizes="(min-width: 1024px) 20vw, 33vw"
                  />
                </div>
              ) : (
                <ImagePlaceholder
                  label={product ? `${product.title} — product photo` : "New arrival — product photo"}
                  aspect="aspect-[3/4]"
                  className="transition-opacity group-hover:opacity-90"
                />
              )}
              <p className="mt-2 text-center text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                {t("newArrivalTag")}
              </p>
            </Link>
          );
        })}
      </div>
      <Link
        href="/new-arrivals"
        className="mt-10 inline-block border border-ink px-6 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-white"
      >
        {t("viewAll")}
      </Link>
    </section>
  );
}
