"use client";

import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CategoryRoom } from "../journey/get-journey-items";
import type { JourneyItem } from "../journey/types";

/**
 * Lets the customer switch what they're trying on without leaving the
 * fitting room — a category tab per room, then that room's items (the same
 * ≤8-per-category cap the 3D ring uses, see get-journey-items.ts), never a
 * wall of the full catalogue. This is what keeps the fitting room from
 * needing its own "300 products" layout: it only ever renders one room's
 * worth of pieces at a time, however large the catalogue grows.
 */
export function TryOnSwitcher({
  rooms,
  current,
  onSelect,
}: {
  rooms: CategoryRoom[];
  current: JourneyItem;
  onSelect: (item: JourneyItem) => void;
}) {
  const t = useTranslations("atelierJourney");
  const activeRoom = rooms.find((r) => r.category === current.category) ?? rooms[0];

  return (
    <div className="mt-6 text-left">
      {rooms.length > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {rooms.map((room) => (
            <button
              key={room.category}
              type="button"
              onClick={() => onSelect(room.items[0])}
              className={clsx(
                "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.08em] transition-colors",
                room.category === activeRoom.category
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink-soft hover:border-ink",
              )}
            >
              {room.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        {t("tryAnother")}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {activeRoom.items.map((item) => {
          const isCurrent = item.slug === current.slug;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onSelect(item)}
              className={clsx(
                "flex w-20 shrink-0 flex-col items-center gap-1 border px-1.5 py-1.5 text-center transition-colors",
                isCurrent ? "border-accent bg-accent/10" : "border-line bg-white/70 hover:border-ink-soft",
              )}
            >
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-cream-deep">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <span className="font-display text-sm text-ink-soft">{item.title.charAt(0)}</span>
                )}
              </span>
              <span className="line-clamp-2 text-[9px] leading-tight text-ink">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
