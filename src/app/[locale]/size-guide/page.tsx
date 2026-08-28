import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function SizeGuidePage() {
  const t = await getTranslations("footer");
  return (
    <SimplePage title={t("sizeGuide")}>
      <p>
        [占位文案 — each product page lists exact measurements under
        &ldquo;Measurements&rdquo;. Add general guidance here, e.g. average ear clip
        comfort range, chain length reference diagram.]
      </p>
    </SimplePage>
  );
}
