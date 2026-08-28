import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Stripe webhook — the second half of preventing double-sales on
 * one-of-one inventory (see README "Before you sell anything" section).
 *
 * Not wired to persistent storage yet: `markProductAsSold` below is a
 * stub. Wire it to whatever store holds product state (Vercel KV,
 * Supabase, etc.) before relying on this for real orders — right now
 * nothing actually removes a sold piece from the catalogue.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 400 },
    );
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const lineItems = await getStripe().checkout.sessions.listLineItems(
      session.id,
    );
    for (const item of lineItems.data) {
      const name = item.description;
      // TODO: look up the product by name/id and persist `sold: true`,
      // then also stop selling it in the /api/checkout route's catalogue
      // lookup. See README for recommended storage options.
      console.log("Mark as sold:", name);
    }
  }

  return NextResponse.json({ received: true });
}
