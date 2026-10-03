"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function JewelryNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  return (
    <details className="group relative">
      <summary className="cursor-pointer py-2 text-sm uppercase tracking-[0.08em] hover:text-accent">{t("allJewelry")}</summary>
      <div className="z-50 mt-1 flex min-w-52 flex-col border border-line bg-cream p-3 shadow-sm xl:absolute xl:left-0 xl:top-full">
        {[{ href: "/jewelry", key: "allJewelry" }, { href: "/ear-clips", key: "earClips" }, { href: "/earrings-studs", key: "earringsStuds" }, { href: "/necklaces", key: "necklaces" }].map((item) => <Link key={item.href} href={item.href} onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); onNavigate?.(); }} className="whitespace-nowrap px-2 py-2 text-sm hover:text-accent">{t(item.key)}</Link>)}
      </div>
    </details>
  );
}
