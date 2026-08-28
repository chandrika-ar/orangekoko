import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function JournalPage() {
  const t = await getTranslations("nav");
  return (
    <SimplePage title={t("journal")}>
      <p>[占位文案 — editorial notes on sourcing trips, era guides, and styling. Phase 2.]</p>
    </SimplePage>
  );
}
