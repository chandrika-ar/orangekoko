import { getTranslations } from "next-intl/server";
import { ProductGridPage } from "@/components/shop/product-grid-page";
import { getProductsByCategory } from "@/lib/products";

export default async function EarClipsPage() {
  const t = await getTranslations("home");
  return (
    <ProductGridPage
      title={t("earClipsLabel")}
      products={await getProductsByCategory("ear-clips")}
    />
  );
}
