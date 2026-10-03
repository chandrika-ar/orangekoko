import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MusubiIcon } from "@/components/atelier/musubi-icon";
import { StampBadge } from "@/components/atelier/stamp-badge";
import { FilmGrainOverlay } from "@/components/atelier/film-grain-overlay";
import { ImagePlaceholder } from "@/components/image-placeholder";

export default async function AtelierHubPage() {
  const t = await getTranslations("atelierPage");

  const doors = [
    {
      href: "/atelier/explore",
      title: t("exploreTitle"),
      body: t("exploreBody"),
      cta: t("exploreCta"),
      soon: true,
      label: "Explore the room — corridor of shelves, soft light",
    },
    {
      href: "/atelier/process",
      title: t("processTitle"),
      body: t("processBody"),
      cta: t("processCta"),
      soon: false,
      label: "Behind every piece — hands cleaning a small earring",
    },
    {
      href: "/atelier/try-on",
      title: t("tryOnTitle"),
      body: t("tryOnBody"),
      cta: t("tryOnCta"),
      soon: true,
      label: "Try it on — mirror with soft light",
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-cream-deep py-16 text-center">
        <FilmGrainOverlay opacity={0.04} />
        <div className="relative mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            <MusubiIcon size={16} className="text-accent" />
            {t("eyebrow")}
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
            {t("intro")}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:px-8">
        {doors.map((door) => (
          <Link key={door.href} href={door.href} className="group relative block">
            {door.soon && (
              <StampBadge
                label={t("comingSoon")}
                collected={false}
                className="absolute -right-2 -top-2 z-10 bg-cream"
              />
            )}
            <ImagePlaceholder
              label={door.label}
              aspect="aspect-[3/4]"
              className="transition-opacity group-hover:opacity-90"
            />
            <h2 className="mt-4 font-display text-xl">{door.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{door.body}</p>
            <span className="mt-2 inline-block border-b border-ink pb-0.5 text-[11px] uppercase tracking-[0.1em]">
              {door.cta}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
