import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function CategoryGrid() {
  const t = useTranslations("home");

  const items = [
    { href: "/ear-clips", label: t("earClipsLabel"), src: "/category-ear-clips.jpg" },
    { href: "/earrings-studs", label: t("earringsStudsLabel"), src: "/category-pierced-earrings.jpg" },
    { href: "/necklaces", label: t("necklacesLabel"), src: "/category-necklaces.jpg" },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="group block">
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={item.src}
              alt={item.label}
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes="(min-width: 640px) 33vw, 100vw"
            />
          </div>
          <div className="border-x border-b border-line bg-cream-deep py-5 text-center">
            <p className="text-sm uppercase tracking-[0.15em]">{item.label}</p>
            <span className="mt-1 inline-block border-b border-ink text-[11px] uppercase tracking-[0.1em] text-ink-soft">
              {t("discover")}
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
