import { useTranslations } from "next-intl";

export function FeaturesRow() {
  const t = useTranslations("home");

  const items = [
    { icon: "/icon-shipping.png", title: t("feature1Title"), body: t("feature1Body") },
    { icon: "/icon-wrapping.png", title: t("feature2Title"), body: t("feature2Body") },
    { icon: "/icon-authentic.png", title: t("feature3Title"), body: t("feature3Body") },
    { icon: "/icon-help.png", title: t("feature4Title"), body: t("feature4Body") },
  ];

  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 text-center sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon, title, body }) => (
          <div key={title} className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" className="h-16 w-16 object-contain" />
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
