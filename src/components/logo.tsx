import Link from "next/link";
import type { Locale } from "@/i18n/routing";

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/${locale}`}
      className="flex flex-col items-center shrink-0"
      aria-label="orangekoko — home"
    >
      <span className="font-display text-2xl tracking-tight">orangekoko</span>
    </Link>
  );
}
