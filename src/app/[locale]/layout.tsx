import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CurrencyRatesProvider } from "@/components/currency-provider";
import { getExchangeRates } from "@/lib/currency";
import { AuthSessionProvider } from "@/components/session-provider";
import "../globals.css";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale: Locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const rates = await getExchangeRates();

  return (
    <html lang={locale} className={`${displayFont.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>
            <CurrencyRatesProvider rates={rates}>
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
              <CartDrawer />
            </CurrencyRatesProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
