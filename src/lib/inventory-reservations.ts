import { sanityWriteClient } from "@/sanity/lib/client";
import type { Product } from "@/lib/products";

interface ReservedLine { id: string; quantity: number; field: "stock" | "preorderCapacity" | "sold" }
interface Reservation { _id: string; _rev: string; state: "held" | "paid" | "released"; lines: ReservedLine[] }

// A revision-guarded transaction reserves all lines together. Concurrent
// checkouts cannot both consume the same final piece or card pack.
export async function reserveInventory(id: string, sessionId: string, items: { product: Product; quantity: number }[]) {
  if (!sanityWriteClient) throw new Error("Inventory writes are not configured");
  let transaction = sanityWriteClient.transaction();
  const lines: ReservedLine[] = [];
  for (const { product, quantity } of items) {
    if (!product.revision) throw new Error("Missing product revision");
    const field = product.category === "handmade-cards" ? product.fulfilment === "preorder" ? "preorderCapacity" : "stock" : "sold";
    transaction = transaction.patch(product.id, (patch) => {
      const guarded = patch.ifRevisionId(product.revision!);
      return field === "sold" ? guarded.set({ sold: true }) : guarded.dec({ [field]: quantity });
    });
    lines.push({ id: product.id, quantity, field });
  }
  await transaction.create({ _id: id, _type: "inventoryReservation", state: "held", sessionId, lines }).commit();
}

export async function settleInventory(id: string, paid: boolean) {
  if (!sanityWriteClient) throw new Error("Inventory writes are not configured");
  const reservation = await sanityWriteClient.getDocument<Reservation>(id);
  if (!reservation || reservation.state !== "held") return;
  let transaction = sanityWriteClient.transaction().patch(id, (patch) => patch.ifRevisionId(reservation._rev).set({ state: paid ? "paid" : "released" }));
  if (!paid) {
    for (const line of reservation.lines) {
      transaction = transaction.patch(line.id, (patch) => line.field === "sold" ? patch.set({ sold: false }) : patch.inc({ [line.field]: line.quantity }));
    }
  }
  await transaction.commit();
}
