import clsx from "clsx";
import { Link } from "@/i18n/navigation";

export function WaxSeal({
  href,
  label,
  size = 96,
  className,
}: {
  href: string;
  label: string;
  size?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={clsx(
        "group relative inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-95",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full shadow-[0_6px_14px_rgba(33,28,23,0.35),inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_5px_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:scale-105"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, var(--color-accent-soft), var(--color-accent) 55%, #93431c 100%)",
        }}
      />
      <svg
        viewBox="0 0 48 48"
        width={size * 0.46}
        height={size * 0.46}
        className="relative text-cream"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        aria-hidden
      >
        <circle cx="24" cy="24" r="15" />
        <path d="M24 10c-5 4-8 8.5-8 14s3 10 8 14c5-4 8-8.5 8-14s-3-10-8-14Z" />
        <path d="M24 10v28M12 24h24" strokeWidth={1} opacity={0.6} />
      </svg>
    </Link>
  );
}
