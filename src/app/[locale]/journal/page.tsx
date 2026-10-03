import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function JournalPage() {
  const home = await getTranslations("home");
  const t = await getTranslations("nav");
  return (
    <SimplePage title={t("journal")}>
      <p>{home("storyBody1")}</p>
    </SimplePage>
  );
}
