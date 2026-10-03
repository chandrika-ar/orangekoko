import clsx from "clsx";
import type { ReactNode } from "react";

export function ParchmentCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative border border-line/70 px-6 py-5 shadow-[0_2px_10px_rgba(33,28,23,0.06)]",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, #f8f2e6 0%, #f1e9d8 60%, #efe4cf 100%)",
      }}
    >
      {children}
    </div>
  );
}
