"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useCartStore } from "@/store/cart-store";
import { useWishlist } from "@/lib/use-wishlist";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteHeader() {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const lineCount = useCartStore((s) => s.lines.length);
  const openCart = useCartStore((s) => s.open);
  const { productIds: wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.length;
  const { status: sessionStatus } = useSession();

  const navItems = [
    { href: "/new-arrivals", label: t("newArrivals") },
    { href: "/ear-clips", label: t("earClips") },
    { href: "/earrings-studs", label: t("earringsStuds") },
    { href: "/necklaces", label: t("necklaces") },
    { href: "/projects", label: t("projects") },
    { href: "/brand", label: t("brand") },
  ];

  return (
    <div className="sticky top-0 z-40">
      <AnnouncementBar />
      <header className="border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            className="xl:hidden -ml-2 p-2"
            aria-label={menuOpen ? t("close") : t("menu")}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className="hidden xl:flex items-center gap-6 text-[13px]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="uppercase tracking-[0.08em] hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Logo locale={locale} />

          <div className="flex items-center gap-4">
            <Link href="/search" aria-label={t("search")} className="hidden sm:inline-flex p-1">
              <Search size={19} />
            </Link>
            <Link href="/wishlist" aria-label={t("wishlist")} className="relative p-1">
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/account" aria-label={t("account")} className="hidden sm:inline-flex p-1">
              <User
                size={19}
                className={sessionStatus === "authenticated" ? "fill-accent text-accent" : undefined}
              />
            </Link>
            <button
              aria-label={t("cart")}
              className="relative p-1"
              onClick={openCart}
            >
              <ShoppingBag size={19} />
              {lineCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                  {lineCount}
                </span>
              )}
            </button>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {menuOpen && (
          <nav className="xl:hidden flex flex-col gap-1 border-t border-line px-4 pb-4 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 uppercase tracking-[0.08em] text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/about" className="py-2 uppercase tracking-[0.08em] text-sm" onClick={() => setMenuOpen(false)}>
              {t("about")}
            </Link>
            <div className="my-2 flex gap-5 border-t border-line pt-3 sm:hidden">
              <Link
                href="/search"
                className="flex items-center gap-2 py-1 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <Search size={17} />
                {t("search")}
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-2 py-1 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <User size={17} className={sessionStatus === "authenticated" ? "fill-accent text-accent" : undefined} />
                {t("account")}
              </Link>
            </div>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}
