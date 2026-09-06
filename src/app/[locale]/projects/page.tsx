import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { ProductCard } from "@/components/shop/product-card";
import { getProductsByProjectTag } from "@/lib/products";

const AUTUMN_EDIT_TAG = "autumn-edit-01";

export default async function ProjectsPage() {
  const tp = await getTranslations("projectsPage");
  const home = await getTranslations("home");
  const pieces = await getProductsByProjectTag(AUTUMN_EDIT_TAG);

  return (
    <div>
      <ImagePlaceholder
        label="Autumn Edit hero — maple leaves and lacquerware on a low wooden table, golden hour light"
        aspect="aspect-[16/8]"
      />

      <div className="mx-auto max-w-xl px-4 pt-16 pb-10 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          {tp("issueLabel")} — {tp("seasonLabel")}
        </p>
        <h1 className="mt-2 font-display text-3xl">{tp("title")}</h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{tp("intro")}</p>
      </div>

      {pieces.length > 0 ? (
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-10 px-4 pb-14 sm:px-6 sm:grid-cols-3 lg:px-8">
          {pieces.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 pb-6 sm:px-6 sm:grid-cols-3 lg:px-8">
            <ImagePlaceholder label="Autumn Edit — piece coming soon" aspect="aspect-[3/4]" />
            <ImagePlaceholder label="Autumn Edit — piece coming soon" aspect="aspect-[3/4]" />
            <ImagePlaceholder label="Autumn Edit — piece coming soon" aspect="aspect-[3/4]" className="hidden sm:block" />
            <ImagePlaceholder label="Autumn Edit — piece coming soon" aspect="aspect-[3/4]" className="hidden sm:block" />
            <ImagePlaceholder label="Autumn Edit — piece coming soon" aspect="aspect-[3/4]" className="hidden sm:block" />
            <ImagePlaceholder label="Autumn Edit — piece coming soon" aspect="aspect-[3/4]" className="hidden sm:block" />
          </div>

          <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-xl">{tp("comingSoonTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{tp("comingSoonBody")}</p>
            <Link
              href="/new-arrivals"
              className="mt-6 inline-block border border-ink px-6 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-white"
            >
              {home("viewAll")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
