export function MusubiIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      className={className}
      aria-hidden
    >
      <path d="M4 12c2-4 6-6 8-4s2 6-2 8-8 0-6-4Z" />
      <path d="M20 12c-2-4-6-6-8-4s-2 6 2 8 8 0 6-4Z" />
    </svg>
  );
}
