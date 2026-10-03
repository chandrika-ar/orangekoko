import { sanityClient } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url";

export type ProductCategory = "earrings-studs" | "ear-clips" | "necklaces" | "handmade-cards";

export interface Product {
  id: string;
  recommendedCardIds?: string[];
  threeCardPriceCents?: number;
  jewelryKind?: "artisan";
  maker?: string;
  craftTechnique?: string;
  madeIn?: string;
  revision?: string;
  stock?: number;
  fulfilment?: "stock" | "preorder";
  preorderCapacity?: number;
  dispatchBy?: string;
  packSize?: 1 | 3;
  packedWeightGrams?: number;
  slug: string;
  category: ProductCategory;
  title: string;
  priceCents: number;
  currency: "EUR";
  /** Number of placeholder image slots to render when there are no real photos yet. */
  imageCount: number;
  /** Real photo URLs from Sanity. Absent for the local sample catalogue. */
  imageUrls?: string[];
  condition: string;
  materials: string;
  era: string;
  origin: string;
  measurements: string;
  description: string[];
  sold?: boolean;
  /** Tags like "autumn-edit-01" linking this piece to a /projects page. */
  projectTags?: string[];
}

interface SanityProductDoc {
  _id: string;
  recommendedCardIds?: string[];
  threeCardPriceEur?: number;
  jewelryKind?: "artisan";
  maker?: string;
  craftTechnique?: string;
  madeIn?: string;
  _rev?: string;
  stock?: number;
  fulfilment?: "stock" | "preorder";
  preorderCapacity?: number;
  dispatchBy?: string;
  packSize?: 1 | 3;
  packedWeightGrams?: number;
  title: string;
  slug: string;
  category: ProductCategory;
  priceEur: number;
  images?: SanityImageSource[];
  condition: string;
  materials: string;
  era: string;
  origin: string;
  measurements: string;
  description: string[];
  sold?: boolean;
  projectTags?: string[];
}

const PRODUCT_PROJECTION = `{
  _id,
  "recommendedCardIds": recommendedCards[]._ref,
  threeCardPriceEur,
  jewelryKind,
  maker,
  craftTechnique,
  madeIn,
  _rev,
  stock,
  fulfilment,
  preorderCapacity,
  dispatchBy,
  packSize,
  packedWeightGrams,
  title,
  "slug": slug.current,
  category,
  priceEur,
  images,
  condition,
  materials,
  era,
  origin,
  measurements,
  description,
  sold,
  projectTags
}`;

function mapSanityProduct(doc: SanityProductDoc): Product {
  return {
    id: doc._id,
    recommendedCardIds: doc.recommendedCardIds,
    threeCardPriceCents: doc.threeCardPriceEur ? Math.round(doc.threeCardPriceEur * 100) : undefined,
    jewelryKind: doc.jewelryKind,
    maker: doc.maker,
    craftTechnique: doc.craftTechnique,
    madeIn: doc.madeIn,
    revision: doc._rev,
    stock: doc.stock,
    fulfilment: doc.fulfilment ?? "stock",
    preorderCapacity: doc.preorderCapacity,
    dispatchBy: doc.dispatchBy,
    packSize: doc.packSize ?? 1,
    packedWeightGrams: doc.packedWeightGrams,
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    priceCents: Math.round(doc.priceEur * 100),
    currency: "EUR",
    imageCount: doc.images?.length ?? 1,
    imageUrls: (doc.images ?? [])
      .map((img) => urlForImage(img)?.width(1600).fit("max").url())
      .filter((url): url is string => Boolean(url)),
    condition: doc.condition,
    materials: doc.materials,
    era: doc.era,
    origin: doc.origin,
    measurements: doc.measurements,
    description: doc.description,
    sold: doc.sold,
    projectTags: doc.projectTags,
  };
}

export const categories: {
  key: Exclude<ProductCategory, "handmade-cards">;
  slug: string;
}[] = [
  { key: "earrings-studs", slug: "earrings-studs" },
  { key: "ear-clips", slug: "ear-clips" },
  { key: "necklaces", slug: "necklaces" },
];

// No invented stock. Products must have real maker/provenance information.
export const products: Product[] = [];
const CURRENT_CATALOGUE = '((category == "handmade-cards" && (!defined(packSize) || packSize == 1)) || (category != "handmade-cards" && jewelryKind == "artisan"))';

export async function getAllProducts(): Promise<Product[]> {
  if (!sanityClient) return products;
  try {
    const docs = await sanityClient.fetch<SanityProductDoc[]>(
      `*[_type == "product" && ${CURRENT_CATALOGUE}] | order(_createdAt desc) ${PRODUCT_PROJECTION}`,
    );
    return docs.map(mapSanityProduct);
  } catch (err) {
    console.error("Sanity fetch failed; hiding unavailable catalogue", err);
    return [];
  }
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  if (!sanityClient) {
    return products.filter((p) => p.category === category);
  }
  try {
    const docs = await sanityClient.fetch<SanityProductDoc[]>(
      `*[_type == "product" && ${CURRENT_CATALOGUE} && category == $category] | order(_createdAt desc) ${PRODUCT_PROJECTION}`,
      { category },
    );
    return docs.map(mapSanityProduct);
  } catch (err) {
    console.error("Sanity fetch failed; hiding unavailable catalogue", err);
    return [];
  }
}

export async function getProductsByProjectTag(tag: string): Promise<Product[]> {
  if (!sanityClient) {
    return products.filter((p) => p.projectTags?.includes(tag));
  }
  try {
    const params: Record<string, unknown> = { tag };
    const docs = await sanityClient.fetch<SanityProductDoc[]>(
      `*[_type == "product" && ${CURRENT_CATALOGUE} && $tag in projectTags] | order(_createdAt desc) ${PRODUCT_PROJECTION}`,
      params,
    );
    return docs.map(mapSanityProduct);
  } catch (err) {
    console.error("Sanity fetch failed; hiding unavailable catalogue", err);
    return [];
  }
}

export async function getProductBySlug(
  slug: string,
  options?: { fresh?: boolean },
): Promise<Product | undefined> {
  if (!sanityClient) {
    return products.find((p) => p.slug === slug);
  }
  try {
    const doc = await (options?.fresh ? sanityClient.withConfig({ useCdn: false }) : sanityClient).fetch<SanityProductDoc | null>(
      `*[_type == "product" && ${CURRENT_CATALOGUE} && slug.current == $slug][0] ${PRODUCT_PROJECTION}`,
      { slug },
    );
    return doc ? mapSanityProduct(doc) : undefined;
  } catch (err) {
    console.error("Sanity fetch failed; hiding unavailable catalogue", err);
    return undefined;
  }
}

export function formatPrice(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
