import { getTranslations } from "next-intl/server";
import { SimplePage } from "@/components/simple-page";

export default async function ShippingPage() {
  const t = await getTranslations("footer");
  const tp = await getTranslations("product");
  return (
    <SimplePage title={t("shipping")}>
      <p>{tp("shippingBody")}</p>
      <p>
        [占位文案 — list carriers (Japan Post EMS / e-packet), per-country
        rates and tracking details once shipping is finalized.]
      </p>
    </SimplePage>
  );
}
