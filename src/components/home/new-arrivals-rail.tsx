import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllProducts } from "@/lib/products";
import { splitCollections } from "@/lib/catalogue-view";
import { ProductCard } from "@/components/shop/product-card";

export async function NewArrivalsRail() {
 const t = await getTranslations("home"); const nav = await getTranslations("nav");
 const collections = splitCollections(await getAllProducts(),6);
 return <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10"><h2 className="text-center font-display text-3xl">{nav("newArrivals")}</h2>
 <div className="mt-8 grid gap-8 md:grid-cols-2">{[{id:"jewelry",pieces:collections.jewelry,title:nav("allJewelry")},{id:"cards",pieces:collections.cards,title:nav("handmadeCards")}].map(collection=><div key={collection.id} className="flex flex-col border-t border-line pt-6"><h3 className="font-display text-2xl">{collection.title}</h3>{collection.pieces.length ? <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">{collection.pieces.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <p className="mt-5 flex-1 text-sm text-ink-soft">{t("noProducts")}</p>}<Link href={`/new-arrivals#${collection.id}`} className="mt-6 w-fit border-b border-ink pb-1 text-sm">{t("viewAll")}</Link></div>)}</div></section>;
}
