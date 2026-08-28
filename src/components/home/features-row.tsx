import { useTranslations } from "next-intl";
import { BadgeCheck, Gift, LifeBuoy, Package } from "lucide-react";

export function FeaturesRow() {
  const t = useTranslations("home");

  const items = [
    { icon: Package, title: t("feature1Title"), body: t("feature1Body") },
    { icon: Gift, title: t("feature2Title"), body: t("feature2Body") },
    { icon: BadgeCheck, title: t("feature3Title"), body: t("feature3Body") },
    { icon: LifeBuoy, title: t("feature4Title"), body: t("feature4Body") },
  ];

  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 text-center sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col items-center gap-3">
            <Icon size={26} strokeWidth={1.25} className="text-accent" />
            <p className="text-xs uppercase tracking-[0.1em]">{title}</p>
            <p className="max-w-[180px] text-xs leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
