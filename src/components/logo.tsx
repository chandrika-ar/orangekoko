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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={22} height={22} className="-mt-0.5 h-[18px] w-[18px] object-contain" />
    </Link>
  );
}
