import { getTranslations } from "next-intl/server";
import { getAllProducts } from "@/lib/products";
import { ProductGridPage } from "@/components/shop/product-grid-page";

export default async function JewelryPage() {
  const t = await getTranslations("nav");
  const products = (await getAllProducts()).filter((p) => p.category !== "handmade-cards");
  return <ProductGridPage title={t("allJewelry")} products={products} />;
}
