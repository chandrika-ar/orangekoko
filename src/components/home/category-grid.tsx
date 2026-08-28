import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";

export function CategoryGrid() {
  const t = useTranslations("home");

  const items = [
    { href: "/ear-clips", label: t("earClipsLabel"), img: "Ear clips — flat lay on textured linen" },
    { href: "/earrings-studs", label: t("earringsStudsLabel"), img: "Pierced earrings — flat lay on dark wood" },
    { href: "/necklaces", label: t("necklacesLabel"), img: "Necklace — draped detail shot" },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="group block">
          <ImagePlaceholder label={item.img} aspect="aspect-square" className="transition-opacity group-hover:opacity-90" />
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
