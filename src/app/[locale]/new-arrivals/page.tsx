import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/shop/product-card";
import { getAllProducts } from "@/lib/products";
import { splitCollections } from "@/lib/catalogue-view";
import { Link } from "@/i18n/navigation";

export default async function NewArrivalsPage() {
 const t = await getTranslations("home"); const nav = await getTranslations("nav");
 const collections = splitCollections(await getAllProducts(),6);
 return <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
 <header className="text-center"><h1 className="font-display text-4xl">{nav("newArrivals")}</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{t("newArrivalsSubtitle")}</p>
 <nav className="mt-6 flex flex-wrap justify-center gap-6 text-sm"><Link href="#jewelry" className="border-b border-ink pb-1">{nav("allJewelry")}</Link><Link href="#cards" className="border-b border-ink pb-1">{nav("handmadeCards")}</Link></nav></header>
 {[{id:"jewelry",pieces:collections.jewelry,href:"/jewelry",title:nav("allJewelry")},{id:"cards",pieces:collections.cards,href:"/handmade-cards",title:nav("handmadeCards")}].map(collection=><section key={collection.id} id={collection.id} className="mt-14 scroll-mt-36 border-t border-line pt-8"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-display text-3xl">{collection.title}</h2><Link href={collection.href} className="border-b border-ink pb-1 text-sm">{t("viewAll")}</Link></div>
 {collection.id === "jewelry" && <nav className="mt-5 flex flex-wrap gap-5 text-sm">{[{href:"/ear-clips",key:"earClips"},{href:"/earrings-studs",key:"earringsStuds"},{href:"/necklaces",key:"necklaces"}].map(category=><Link key={category.href} href={category.href} className="hover:text-accent">{nav(category.key)}</Link>)}</nav>}
 {collection.pieces.length ? <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">{collection.pieces.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <p className="mt-8 text-sm text-ink-soft">{t("noProducts")}</p>}
 </section>)}</div>;
}
