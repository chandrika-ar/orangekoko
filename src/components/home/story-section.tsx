import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function StorySection() {
  const t = useTranslations("home");

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-4 bg-cream-deep px-8 py-16 sm:px-14 lg:py-0">
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
      <div
        className="image-placeholder min-h-[360px]"
        role="img"
        aria-label="Story image — a traditional Japanese dressing table (kyodai) with mirror, in warm interior light. Replace with real photography."
      >
        <span className="max-w-xs px-6 text-center text-xs uppercase tracking-[0.15em]">
          Story image placeholder — Japanese vintage vanity / dressing table
          (kyōdai), warm interior light. Replace with real photography.
        </span>
      </div>
    </section>
  );
}
