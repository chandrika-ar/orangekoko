import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProcessFilmstrip } from "@/components/atelier/process-filmstrip";
import { MusubiIcon } from "@/components/atelier/musubi-icon";

export default async function AtelierProcessPage() {
  const t = await getTranslations("process");
  const ta = await getTranslations("atelierPage");

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ink-soft">
        <MusubiIcon size={16} className="text-accent" />
        {ta("eyebrow")}
      </div>
      <h1 className="mt-3 font-display text-3xl">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        {t("intro")}
      </p>

      <ProcessFilmstrip className="mt-10" />

      <Link
        href="/atelier"
        className="mt-12 inline-block border-b border-ink pb-0.5 text-[11px] uppercase tracking-[0.1em]"
      >
        {ta("backToAtelier")}
      </Link>
    </div>
  );
}
