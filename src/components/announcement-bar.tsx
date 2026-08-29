import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("announcement");
  return (
    <div className="bg-[#4b4d33] text-white">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-6 px-4 text-[11px] uppercase tracking-[0.1em]">
        <span>{t("freeShipping")}</span>
        <span className="hidden sm:inline opacity-50">|</span>
        <span className="hidden sm:inline">{t("packedInTokyo")}</span>
      </div>
    </div>
  );
}
