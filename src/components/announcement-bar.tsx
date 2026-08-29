import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("announcement");
  return (
    <div className="bg-[#4b4d33] text-white">
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-6 px-4 py-2 text-center text-[11px] uppercase tracking-[0.1em]">
        <span>{t("freeShipping")}</span>
        <span className="hidden sm:inline opacity-50">|</span>
        <span className="hidden sm:inline">{t("packedInTokyo")}</span>
      </div>
    </div>
  );
}
