import { getTranslations } from "next-intl/server";
import { categories, getAllProducts, formatPrice } from "@/lib/products";
import type { JourneyItem } from "./types";

export interface CategoryRoom {
  category: JourneyItem["category"];
  label: string;
  items: JourneyItem[];
}

// Capped per category so the room stays a "walk past a curated shelf", not a
// crowd — see docs/atelier-3d-technical-design.md's per-ring item budget.
// At 500 SKUs the ring can't just grow to fit all of them; this is where a
// "view all N in Ear Clips" link into the flat /ear-clips page would want to
// live once there's real inventory to page through.
const ITEMS_PER_ROOM = 8;

const NAV_KEY: Record<JourneyItem["category"], string> = {
  "earrings-studs": "earringsStuds",
  "ear-clips": "earClips",
  necklaces: "necklaces",
};

export async function getJourneyRooms(locale: string): Promise<CategoryRoom[]> {
  const [products, nav] = await Promise.all([getAllProducts(), getTranslations("nav")]);

  return categories
    .map(({ key }) => {
      const items: JourneyItem[] = products
        .filter((p) => p.category === key)
        .slice(0, ITEMS_PER_ROOM)
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          priceLabel: formatPrice(p.priceCents, p.currency, locale),
          category: p.category,
        }));
      return { category: key, label: nav(NAV_KEY[key]), items };
    })
    .filter((room) => room.items.length > 0);
}
