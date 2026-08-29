import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function BrandPage() {
  const t = await getTranslations("nav");
  return (
    <SimplePage title={t("brand")}>
      <p>[占位文案 — the values, aesthetic and people behind orangekoko. Phase 2.]</p>
    </SimplePage>
  );
}
