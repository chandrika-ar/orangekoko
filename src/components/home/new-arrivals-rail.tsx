import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/shop/product-card";

export async function NewArrivalsRail() {
 const t = await getTranslations("home"); const nav = await getTranslations("nav");
 const products = await getAllProducts();
 return <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10"><h2 className="text-center font-display text-3xl">{t("newArrivalsTitle")}</h2>
 <div className="mt-8 grid gap-8 md:grid-cols-2">{[{cards:false,href:"/jewelry",title:nav("allJewelry")},{cards:true,href:"/handmade-cards",title:nav("handmadeCards")}].map(collection=>{
 const pieces=products.filter(p=>(p.category === "handmade-cards") === collection.cards && (!collection.cards || (p.packSize ?? 1) === 1)).slice(0,2);
 return <div key={collection.href} className="flex flex-col border-t border-line pt-6"><h3 className="font-display text-2xl">{collection.title}</h3>{pieces.length ? <div className="mt-6 grid grid-cols-2 gap-4">{pieces.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <p className="mt-5 flex-1 text-sm text-ink-soft">{t("noProducts")}</p>}<Link href={collection.href} className="mt-6 w-fit border-b border-ink pb-1 text-sm">{t("viewAll")}</Link></div>;
 })}</div></section>;
}
