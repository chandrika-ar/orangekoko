import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getAllProducts } from "@/lib/products";
import { ProductGridPage } from "@/components/shop/product-grid-page";

export default async function JewelryPage() {
  const t = await getTranslations("nav");
  const atelier=await getTranslations("atelierPage");
  const products = (await getAllProducts()).filter((p) => p.category !== "handmade-cards");
  return <><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-6"><p className="text-sm text-ink-soft">{atelier("tryOnBody")}</p><Link href="/try-on" className="border border-accent px-5 py-3 text-sm text-accent hover:bg-accent hover:text-white">{atelier("tryOnTitle")}</Link></div><ProductGridPage title={t("allJewelry")} products={products} /></>;
}
