import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function ProjectsPage() {
  const t = await getTranslations("nav");
  return (
    <SimplePage title={t("projects")}>
      <p>[占位文案 — themed capsule collections and collaborations, curated around a season, material or era. Phase 2.]</p>
    </SimplePage>
  );
}
