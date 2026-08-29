import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function ReturnsPage() {
  const t = await getTranslations("footer");
  return (
    <SimplePage title={t("returns")}>
      <p>
        [占位文案 — since every piece is one-of-one, state your return /
        change-of-mind policy clearly here (e.g. EU 14-day right of
        withdrawal under Directive 2011/83/EU) before launch.]
      </p>
    </SimplePage>
  );
}
