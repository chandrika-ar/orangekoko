import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getStripe } from "@/lib/stripe";
import { settleInventory } from "@/lib/inventory-reservations";

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let reservationId: string;
  try { ({ reservationId } = await req.json()); } catch { return NextResponse.json({ error: "Invalid reservation" }, { status: 400 }); }
  if (typeof reservationId !== "string" || !/^inventory-reservation-[0-9a-f-]{36}$/.test(reservationId)) return NextResponse.json({ error: "Invalid reservation" }, { status: 400 });
  const cookieName = `orangekoko-checkout-${reservationId}`;
  const cookie = req.cookies.get(cookieName)?.value;
  if (!cookie) return NextResponse.json({ released: true });
  try {
    const { sessionId, token } = JSON.parse(cookie);
    if (typeof sessionId !== "string" || typeof token !== "string") return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const expected = session.metadata?.cancellationToken;
    if (session.metadata?.inventoryReservation !== reservationId || !expected || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    if (session.status === "complete" || session.payment_status === "paid") return NextResponse.json({ error: "Payment is already in progress" }, { status: 409 });
    if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
    if (session.metadata?.inventoryReservation) await settleInventory(session.metadata.inventoryReservation, false);
    const response = NextResponse.json({ released: true });
    response.cookies.delete(cookieName);
    return response;
  } catch (err) {
    console.error("Checkout cancellation failed", err);
    return NextResponse.json({ error: "Could not release checkout" }, { status: 500 });
  }
}
