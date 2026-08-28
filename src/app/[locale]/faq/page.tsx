import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function FaqPage() {
  const t = await getTranslations("footer");
  return (
    <SimplePage title={t("faq")}>
      <p>[占位文案 — Are pieces really one of one? Yes — once sold, gone for good.]</p>
      <p>[占位文案 — How is condition graded? See &ldquo;Condition &amp; Authenticity&rdquo; on the homepage.]</p>
      <p>[占位文案 — Where do you ship from? All orders ship from Tokyo, Japan.]</p>
    </SimplePage>
  );
}
