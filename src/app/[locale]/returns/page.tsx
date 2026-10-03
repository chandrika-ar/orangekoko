import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function ReturnsPage() {
  const t = await getTranslations("footer");
  const tr = await getTranslations("returns");
  return (
    <SimplePage title={t("returns")}>
      <p>{tr("intro")}</p>
      <h2 className="font-display text-lg text-ink">{tr("policyTitle")}</h2>
      <p>{tr("policyBody")}</p>
      <h2 className="font-display text-lg text-ink">{tr("beforeTitle")}</h2>
      <p>{tr("beforeBody")}</p>
      <h2 className="font-display text-lg text-ink">{tr("issueTitle")}</h2>
      <p>{tr("issueBody")}</p>
    </SimplePage>
  );
}
