import { getTranslations } from "next-intl/server";
import { getJourneyRooms } from "@/components/atelier/journey/get-journey-items";
import { AtelierJourneyLoader } from "@/components/atelier/journey/atelier-journey-loader";
import { MusubiIcon } from "@/components/atelier/musubi-icon";

export default async function AtelierExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("atelierPage");
  const rooms = await getJourneyRooms(locale);

  return (
    <div>
      <div className="mx-auto flex items-center justify-center gap-2 py-6 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
        <MusubiIcon size={16} className="text-accent" />
        {t("eyebrow")}
      </div>
      <AtelierJourneyLoader rooms={rooms} />
    </div>
  );
}
