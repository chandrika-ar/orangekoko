import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative flex h-[78vh] min-h-[520px] items-end overflow-hidden">
      <Image
        src="/hero-portrait.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[55%_center]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-16 text-center text-white">
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">
          {t("titleLine1")}
          <br />
          <span className="italic">{t("titleLine2")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-xs uppercase tracking-[0.12em] text-white/90">
          {t("subtitle")}
        </p>
        <Link
          href="/new-arrivals"
          className="mt-7 inline-block border border-white px-6 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors hover:bg-white hover:text-ink"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
