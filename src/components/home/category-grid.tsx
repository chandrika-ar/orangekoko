import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function CategoryGrid() {
  const t = useTranslations("home");
  const nav = useTranslations("nav");
  const shop = useTranslations("cardShop");
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-2 sm:px-10">
      {[{ href: "/jewelry", title: nav("allJewelry"), body: t("storyBody2"), src: "/handmade-jewelry-editorial.webp", cta: shop("browseJewelry") }, { href: "/handmade-cards", title: nav("handmadeCards"), body: t("storyBody3"), src: "/handmade-cards-editorial.webp", cta: shop("browseCards") }].map((item) => (
        <article key={item.href} className="flex flex-col border border-line bg-cream-deep">
          <Link href={item.href} className="relative block aspect-square overflow-hidden"><Image src={item.src} alt={item.title} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" /></Link>
          <div className="flex flex-1 flex-col p-6 sm:p-8"><h2 className="font-display text-3xl">{item.title}</h2><p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          {item.href === "/jewelry" && <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">{[{href:"/ear-clips",key:"earClips"},{href:"/earrings-studs",key:"earringsStuds"},{href:"/necklaces",key:"necklaces"}].map((category)=><Link key={category.href} href={category.href} className="hover:text-accent">{nav(category.key)}</Link>)}</div>}
          <Link href={item.href} className="mt-6 w-fit border-b border-ink pb-1 text-sm hover:text-accent">{item.cta}</Link></div>
        </article>
      ))}
    </section>
  );
}
