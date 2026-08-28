import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function ContactPage() {
  const t = await getTranslations("footer");
  return (
    <SimplePage title={t("contact")}>
      <p>[占位文案 — support email address, and expected response time.]</p>
    </SimplePage>
  );
}
