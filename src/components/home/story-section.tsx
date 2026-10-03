import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function StorySection() {
  const t = useTranslations("home");

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-4 bg-cream-deep px-8 py-16 sm:px-14 lg:py-20">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          {t("storyEyebrow")}
        </p>
        <h2 className="font-display text-3xl leading-snug sm:text-4xl">
          {t("storyTitleLine1")}
          <br />
          <span className="italic">{t("storyTitleLine2")}</span>
        </h2>
        <span className="h-px w-10 bg-accent" />
        <div className="mt-1 max-w-sm space-y-3 text-sm leading-relaxed text-ink-soft">
          <p>{t("storyBody1")}</p>
          <p>{t("storyBody2")}</p>
          <p>{t("storyBody3")}</p>
        </div>
        <Link
          href="/about"
          className="mt-2 inline-block w-fit border-b border-ink pb-0.5 text-[11px] uppercase tracking-[0.12em]"
        >
          {t("storyCta")}
        </Link>
      </div>
      <div className="flex flex-col justify-center gap-8 bg-ink px-8 py-16 text-cream sm:px-14">
        <span className="h-px w-12 bg-accent" />
        <p className="font-display text-2xl leading-relaxed sm:text-3xl">{t("storyBody2")}</p>
        <p className="max-w-md text-base leading-relaxed text-cream/80">{t("storyBody3")}</p>
      </div>
    </section>
  );
}
