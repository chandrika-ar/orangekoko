import clsx from "clsx";

export function StampBadge({
  label,
  collected,
  className,
}: {
  label: string;
  collected: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex h-20 w-20 -rotate-6 shrink-0 flex-col items-center justify-center rounded-full border-2 text-center transition-colors duration-300",
        collected ? "border-accent text-accent" : "border-dashed border-line text-line",
        className,
      )}
    >
      <span className="px-2 text-[9px] uppercase leading-tight tracking-[0.1em]">
        {label}
      </span>
    </div>
  );
}
