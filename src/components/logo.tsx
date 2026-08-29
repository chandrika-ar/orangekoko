import Link from "next/link";
import type { Locale } from "@/i18n/routing";

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/${locale}`}
      className="flex items-center gap-2 shrink-0"
      aria-label="orangekoko — home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" className="h-7 w-7 object-contain" />
      <span className="font-display text-2xl italic tracking-wide text-ink">orangekoko</span>
    </Link>
  );
}
