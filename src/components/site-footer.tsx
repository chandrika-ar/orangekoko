"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/routing";
import { useRouter, usePathname } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="border-t border-line bg-cream-deep">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 text-sm sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("shop")}
          </p>
          <ul className="space-y-2">
            <li><Link href="/new-arrivals">{nav("newArrivals")}</Link></li>
            <li><Link href="/ear-clips">{nav("earClips")}</Link></li>
            <li><Link href="/earrings-studs">{nav("earringsStuds")}</Link></li>
            <li><Link href="/necklaces">{nav("necklaces")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("about")}
          </p>
          <ul className="space-y-2">
            <li><Link href="/about">{t("ourStory")}</Link></li>
            <li><Link href="/about#sourcing">{t("sourcing")}</Link></li>
            <li><Link href="/journal">{t("journal")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("help")}
          </p>
          <ul className="space-y-2">
            <li><Link href="/shipping">{t("shipping")}</Link></li>
            <li><Link href="/returns">{t("returns")}</Link></li>
            <li><Link href="/size-guide">{t("sizeGuide")}</Link></li>
            <li><Link href="/faq">{t("faq")}</Link></li>
            <li><Link href="/contact">{t("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("newsletter")}
          </p>
          <p className="mb-3 text-ink-soft">{t("newsletterHint")}</p>
          {submitted ? (
            <p className="text-accent">{t("newsletterThanks")}</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="flex border-b border-ink"
            >
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full bg-transparent py-1.5 text-sm placeholder:text-ink-soft focus:outline-none"
              />
              <button type="submit" className="px-2 text-xs uppercase tracking-[0.1em]">
                {t("subscribe")}
              </button>
            </form>
          )}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-ink-soft hover:text-ink"
          >
            {t("instagram")} <ArrowUpRight size={14} />
          </a>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("region")}
          </p>
          <select
            value={locale}
            onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
            className="w-full border border-line bg-cream px-2 py-1.5 text-sm"
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeLabels[l]} — EUR €
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-[11px] text-ink-soft sm:px-6 lg:px-8">
        {t("rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
