import { getTranslations } from "next-intl/server";
import { ProductGridPage } from "@/components/shop/product-grid-page";
import { getAllProducts } from "@/lib/products";

export default async function NewArrivalsPage() {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  return (
    <ProductGridPage
      title={tNav("newArrivals")}
      subtitle={t("newArrivalsSubtitle")}
      products={await getAllProducts()}
    />
  );
}
