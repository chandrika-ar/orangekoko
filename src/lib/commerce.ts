export interface InventoryProduct {
  category: string;
  sold?: boolean;
  stock?: number;
  fulfilment?: "stock" | "preorder";
  preorderCapacity?: number;
  dispatchBy?: string;
}

export function availableQuantity(product: InventoryProduct): number {
  if (product.sold) return 0;
  if (product.category !== "handmade-cards") return 1;
  const count = product.fulfilment === "preorder" ? product.preorderCapacity : product.stock;
  return typeof count === "number" && Number.isInteger(count) && count > 0 ? count : 0;
}

export function normalizeCartLines(input: unknown): { slug: string; quantity: number }[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 100) throw new Error("Invalid cart");
  const quantities = new Map<string, number>();
  for (const line of input) {
    if (!line || typeof line.slug !== "string" || !line.slug.trim() || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error("Invalid cart quantity");
    const count = (quantities.get(line.slug) ?? 0) + line.quantity;
    if (count > 99) throw new Error("Too many items");
    quantities.set(line.slug, count);
  }
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }));
}

export function validatePurchase(product: InventoryProduct, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > availableQuantity(product)) throw new Error("Item is unavailable or requested quantity exceeds stock");
  if (product.fulfilment === "preorder" && (!product.dispatchBy || !/^\d{4}-\d{2}-\d{2}$/.test(product.dispatchBy) || !Number.isFinite(Date.parse(product.dispatchBy)) || product.dispatchBy < new Date().toISOString().slice(0, 10))) throw new Error("Preorder dispatch date is not available");
}

export function cardOrderAllowed(lines: { category: string; quantity: number; packSize?: number }[]): boolean {
  if (lines.some(line => line.category !== "handmade-cards")) return true;
  return lines.reduce((sum, line) => sum + line.quantity * (line.packSize ?? 1), 0) >= 2;
}

export function purchaseTotalCents(priceCents: number, quantity: number, threeCardPriceCents?: number): number {
  const valid = Number.isSafeInteger(threeCardPriceCents) && (threeCardPriceCents ?? 0) > 0 && (threeCardPriceCents ?? 0) < priceCents * 3;
  return valid ? Math.floor(quantity / 3) * threeCardPriceCents! + (quantity % 3) * priceCents : priceCents * quantity;
}
