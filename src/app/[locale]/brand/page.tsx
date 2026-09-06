import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/image-placeholder";

export default async function BrandPage() {
  const t = await getTranslations("nav");
  const tb = await getTranslations("brand");

  return (
    <div>
      <ImagePlaceholder
        label="Brand hero — ikebana arrangement beside a paper window, soft daylight"
        aspect="aspect-[16/8]"
      />

      <div className="mx-auto max-w-xl px-4 pt-16 pb-10 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">{t("brand")}</p>
        <h1 className="mt-2 font-display text-3xl">{tb("title")}</h1>
        <p className="mx-auto mt-8 max-w-md font-display text-2xl italic leading-snug">
          {tb("philosophy1")}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-6 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-deep">
          <Image
            src="/brand-vanity.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{tb("philosophy2")}</p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-6 sm:px-6 md:grid-cols-2 lg:px-8">
        <p className="order-2 text-sm leading-relaxed text-ink-soft md:order-1">
          {tb("philosophy3")}
        </p>
        <ImagePlaceholder
          label="Paper parasol resting against a wooden engawa, dappled afternoon light"
          aspect="aspect-[4/5]"
          className="order-1 md:order-2"
        />
      </div>

      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto space-y-3 text-sm leading-relaxed text-ink-soft">
          <p>{tb("philosophy4")}</p>
          <p>{tb("philosophy5")}</p>
        </div>
        <p className="mt-8 font-display text-xl italic">{tb("closing")}</p>
      </div>
    </div>
  );
}
