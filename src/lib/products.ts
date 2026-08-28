export type ProductCategory = "earrings-studs" | "ear-clips" | "necklaces";

export interface Product {
  id: string;
  slug: string;
  category: ProductCategory;
  title: string;
  priceCents: number;
  currency: "EUR";
  /** Number of placeholder image slots to render on the product page. */
  imageCount: number;
  condition: string;
  materials: string;
  era: string;
  origin: string;
  measurements: string;
  description: string[];
  sold?: boolean;
}

export const categories: {
  key: ProductCategory;
  slug: string;
}[] = [
  { key: "earrings-studs", slug: "earrings-studs" },
  { key: "ear-clips", slug: "ear-clips" },
  { key: "necklaces", slug: "necklaces" },
];

/**
 * Placeholder catalogue. Every field here is editable sample copy —
 * swap in real photography and finalized descriptions per SKU once
 * sourcing is underway. Structure (fields + product-page sections)
 * mirrors the reference site and should not need to change as real
 * inventory is entered.
 */
export const products: Product[] = [
  {
    id: "p1",
    slug: "showa-era-camellia-studs",
    category: "earrings-studs",
    title: "Showa-era Camellia Studs",
    priceCents: 8800,
    currency: "EUR",
    imageCount: 4,
    condition: "Very good — light surface patina consistent with age, original clutches replaced.",
    materials: "Gold-tone brass, red enamel",
    era: "Showa era, c. 1960s",
    origin: "Kyoto estate sale",
    measurements: "1.2 cm diameter",
    sold: false,
    description: [
      "占位文案 — A pair of camellia-motif studs found at an estate sale outside Kyoto, carrying the soft gold patina of decades in a lacquered jewelry box.",
      "The enamel has faded unevenly at the petal edges — the kind of wear that only comes from being worn, not stored.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "p2",
    slug: "taisho-glass-drop-studs",
    category: "earrings-studs",
    title: "Taishō Glass Drop Studs",
    priceCents: 12400,
    currency: "EUR",
    imageCount: 4,
    condition: "Good — one small chip to the underside of one drop, not visible when worn.",
    materials: "Cut glass, silver-tone setting",
    era: "Taishō era, c. 1920s",
    origin: "Osaka antique market",
    measurements: "1.8 cm drop length",
    description: [
      "占位文案 — Faceted glass drops with the soft, slightly uneven cut typical of early Taishō-era costume jewelry.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "p3",
    slug: "hand-painted-porcelain-studs",
    category: "earrings-studs",
    title: "Hand-painted Porcelain Studs",
    priceCents: 7200,
    currency: "EUR",
    imageCount: 3,
    condition: "Very good.",
    materials: "Porcelain, gold-tone fittings",
    era: "1970s",
    origin: "Private collection, Tokyo",
    measurements: "1 cm diameter",
    description: [
      "占位文案 — Miniature hand-painted florals under a soft glaze, fitted to new hypoallergenic posts.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "e1",
    slug: "art-deco-ear-clips",
    category: "ear-clips",
    title: "Art Deco Ear Clips",
    priceCents: 15800,
    currency: "EUR",
    imageCount: 4,
    condition: "Excellent for age — clip mechanism cleaned and tested.",
    materials: "Silver-tone metal, marcasite-style stones",
    era: "c. 1930s–40s",
    origin: "Yokohama estate sale",
    measurements: "2 cm length",
    description: [
      "占位文案 — Geometric ear clips with the crisp lines of Art Deco design, sourced from a Yokohama estate collection.",
      "No piercing required — screw-back clip fitting, gently adjusted for comfort.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "e2",
    slug: "lacquer-red-clip-earrings",
    category: "ear-clips",
    title: "Lacquer Red Clip Earrings",
    priceCents: 9600,
    currency: "EUR",
    imageCount: 3,
    condition: "Good — fine craquelure to the lacquer surface, stable and not flaking.",
    materials: "Urushi lacquer over wood core, brass clip",
    era: "1980s",
    origin: "Kanazawa artisan estate",
    measurements: "2.4 cm diameter",
    description: [
      "占位文案 — Deep red lacquerware clip earrings with a fine web of age-craquelure across the surface.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "n1",
    slug: "meiji-coin-pendant-necklace",
    category: "necklaces",
    title: "Meiji Coin Pendant Necklace",
    priceCents: 18900,
    currency: "EUR",
    imageCount: 5,
    condition: "Good — coin shows honest circulation wear, chain is a later replacement.",
    materials: "Bronze coin pendant, gold-filled chain",
    era: "Meiji era coin, chain c. 1970s",
    origin: "Tokyo flea market",
    measurements: "45 cm chain, 2.2 cm pendant",
    description: [
      "占位文案 — A Meiji-era coin, repurposed as a pendant sometime in the decades since, worn smooth at the high points.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "n2",
    slug: "vintage-pearl-strand",
    category: "necklaces",
    title: "Vintage Pearl Strand",
    priceCents: 21500,
    currency: "EUR",
    imageCount: 4,
    condition: "Very good — clasp re-strung on new silk cord.",
    materials: "Cultured pearls, gold-tone clasp",
    era: "1960s",
    origin: "Kobe estate sale",
    measurements: "40 cm",
    description: [
      "占位文案 — A single strand of cultured pearls with the warm, slightly irregular luster of an older harvest.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
  {
    id: "n3",
    slug: "jade-pendant-on-chain",
    category: "necklaces",
    title: "Jade Pendant on Fine Chain",
    priceCents: 16700,
    currency: "EUR",
    imageCount: 4,
    condition: "Excellent.",
    materials: "Nephrite jade, gold-tone chain",
    era: "1950s",
    origin: "Private collection, Nagoya",
    measurements: "42 cm chain, 1.6 cm pendant",
    description: [
      "占位文案 — A small carved jade pendant, cool and dense in the hand, on a fine later-added chain.",
      "[Placeholder copy — replace with final product description before launch.]",
    ],
  },
];

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
