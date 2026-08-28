import { getTranslations } from "next-intl/server";
import { ImagePlaceholder } from "@/components/image-placeholder";

export default async function AboutPage() {
  const t = await getTranslations("home");

  return (
    <div>
      <ImagePlaceholder
        label="About hero — founder or workspace image, warm natural light"
        aspect="aspect-[16/7]"
      />
      <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          {t("storyEyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl">
          {t("storyTitleLine1")} <span className="italic">{t("storyTitleLine2")}</span>
        </h1>
        <div className="mx-auto mt-6 max-w-lg space-y-4 text-sm leading-relaxed text-ink-soft">
          <p>{t("storyBody1")}</p>
          <p>{t("storyBody2")}</p>
          <p>{t("storyBody3")}</p>
          <p>
            [占位文案 — expand with founder background, sourcing trips, and
            what &ldquo;one-of-one&rdquo; means for orangekoko before launch.]
          </p>
        </div>
      </div>
      <div id="sourcing" className="grid grid-cols-1 lg:grid-cols-2">
        <ImagePlaceholder
          label="Sourcing — estate sale or antique market in Japan"
          aspect="aspect-[4/3]"
        />
        <div className="flex flex-col justify-center gap-3 bg-cream-deep px-8 py-14 sm:px-14">
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            Sourcing
          </p>
          <h2 className="font-display text-2xl">Where each piece begins</h2>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            [占位文案 — describe the estate sales, antique markets and
            collector relationships across Japan that supply orangekoko&apos;s
            catalogue.]
          </p>
        </div>
      </div>
    </div>
  );
}
