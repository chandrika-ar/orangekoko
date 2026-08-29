import { defineRouting } from "next-intl/routing";

// 北欧主流语言: sv, da, no, fi
// 欧洲主流语言: en, de, fr, nl, es, it
export const locales = [
  "en",
  "de",
  "fr",
  "nl",
  "es",
  "it",
  "sv",
  "da",
  "no",
  "fi",
] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  nl: "Nederlands",
  es: "Español",
  it: "Italiano",
  sv: "Svenska",
  da: "Dansk",
  no: "Norsk",
  fi: "Suomi",
};

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
