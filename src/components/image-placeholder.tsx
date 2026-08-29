import clsx from "clsx";

export function ImagePlaceholder({
  label,
  aspect = "aspect-[3/4]",
  className,
}: {
  label: string;
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx("image-placeholder w-full", aspect, className)}
      role="img"
      aria-label={label}
    >
      <span className="px-4 text-center text-xs uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
}
