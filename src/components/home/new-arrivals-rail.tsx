import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ImagePlaceholder } from "@/components/image-placeholder";

export function NewArrivalsRail() {
  const t = useTranslations("home");
  const slots = Array.from({ length: 5 });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h2 className="font-display text-3xl">{t("newArrivalsTitle")}</h2>
      <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
        {t("newArrivalsSubtitle")}
      </p>
      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((_, i) => (
          <Link key={i} href="/new-arrivals" className="group block text-left">
            <ImagePlaceholder
              label="New arrival — product photo"
              aspect="aspect-[3/4]"
              className="transition-opacity group-hover:opacity-90"
            />
            <p className="mt-2 text-center text-[11px] uppercase tracking-[0.1em] text-ink-soft">
              {t("newArrivalTag")}
            </p>
          </Link>
        ))}
      </div>
      <Link
        href="/new-arrivals"
        className="mt-10 inline-block border border-ink px-6 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-white"
      >
        {t("viewAll")}
      </Link>
    </section>
  );
}
