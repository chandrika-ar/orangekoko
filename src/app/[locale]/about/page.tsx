import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function AboutPage() {
  const t = await getTranslations("home");
  const ta = await getTranslations("about");

  return (
    <div>
      <div className="relative aspect-[16/7] w-full overflow-hidden bg-cream-deep">
        <Image
          src="/about-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          {t("storyEyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl">
          {t("storyTitleLine1")} <span className="italic">{t("storyTitleLine2")}</span>
        </h1>
        <div className="mx-auto mt-6 max-w-lg space-y-4 text-left text-sm leading-relaxed text-ink-soft">
          <p>{t("storyBody1")}</p>
          <p>{t("storyBody2")}</p>
          <p>{t("storyBody3")}</p>
          <p className="pt-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            {ta("expandedEyebrow")}
          </p>
          <p>{ta("expandedBody1")}</p>
          <p>{ta("expandedBody2")}</p>
          <p>{ta("expandedBody3")}</p>
          <p>{ta("expandedBodyArtisan")}</p>
          <p>{ta("expandedBody4")}</p>
        </div>
      </div>
    </div>
  );
}
