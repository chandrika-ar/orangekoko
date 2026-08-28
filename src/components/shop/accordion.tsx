"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Accordion({
  items,
}: {
  items: { title: string; content: ReactNode }[];
}) {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <div key={item.title}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between py-4 text-left text-sm uppercase tracking-[0.08em]"
            aria-expanded={open === i}
          >
            {item.title}
            <ChevronDown
              size={16}
              className={`transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="pb-4 text-sm leading-relaxed text-ink-soft">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
