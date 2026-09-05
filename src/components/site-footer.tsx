"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/routing";
import { CURRENCY_BY_LOCALE, CURRENCY_SYMBOL } from "@/lib/currency";
import { useRouter, usePathname } from "@/i18n/navigation";

// lucide-react dropped brand/logo icons, so this is a small inline glyph
// (rounded square + lens + flash dot) instead of a package dependency.
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  return (
    <footer className="border-t border-line bg-cream-deep">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 text-sm sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
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
            <li><Link href="/faq">{t("faq")}</Link></li>
            <li><Link href="/contact">{t("contact")}</Link></li>
          </ul>
        </div>
        <div className="col-span-2">
          <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {t("newsletter")}
          </p>
          <p className="mb-3 text-ink-soft">{t("newsletterHint")}</p>
          {submitted ? (
            <p className="text-accent">{t("newsletterThanks")}</p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setError(false);
                try {
                  const res = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, locale }),
                  });
                  if (!res.ok) throw new Error("failed");
                  setSubmitted(true);
                } catch {
                  setError(true);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="flex max-w-sm gap-2"
            >
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full min-w-0 border border-line bg-cream px-3 py-2.5 text-sm placeholder:text-ink-soft focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="shrink-0 bg-ink px-5 py-2.5 text-xs uppercase tracking-[0.1em] text-white transition-colors hover:bg-accent disabled:opacity-50"
              >
                {t("subscribe")}
              </button>
            </form>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-600">{t("newsletterError")}</p>
          )}
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-ink-soft hover:text-ink"
          >
            <InstagramIcon size={16} />
            {t("instagram")}
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
                {localeLabels[l]} — {CURRENCY_SYMBOL[CURRENCY_BY_LOCALE[l]]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            {t("regionNote")}
          </p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-[11px] text-ink-soft sm:px-6 lg:px-8">
        {t("rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
