import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ParchmentCard } from "@/components/atelier/parchment-card";
import { StampBadge } from "@/components/atelier/stamp-badge";
import { MusubiIcon } from "@/components/atelier/musubi-icon";

export async function AtelierComingSoon({
  titleKey,
  bodyKey,
}: {
  titleKey: string;
  bodyKey: string;
}) {
  const t = await getTranslations("atelierPage");

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
        <MusubiIcon size={16} className="text-accent" />
        {t("eyebrow")}
      </div>
      <h1 className="mt-3 font-display text-3xl">{t(titleKey as "exploreTitle" | "tryOnTitle")}</h1>

      <ParchmentCard className="mx-auto mt-8 flex flex-col items-center gap-4">
        <StampBadge label={t("comingSoon")} collected={false} />
        <p className="text-sm leading-relaxed text-ink-soft">
          {t(bodyKey as "exploreComingSoonBody" | "tryOnComingSoonBody")}
        </p>
      </ParchmentCard>

      <Link
        href="/atelier"
        className="mt-8 inline-block border-b border-ink pb-0.5 text-[11px] uppercase tracking-[0.1em]"
      >
        {t("backToAtelier")}
      </Link>
    </div>
  );
}
