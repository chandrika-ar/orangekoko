import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sanityWriteClient } from "@/sanity/lib/client";
import type Stripe from "stripe";

/**
 * Stripe webhook — the second half of preventing double-sales on
 * one-of-one inventory. Marks each purchased product `sold: true` in
 * Sanity once payment completes. Requires SANITY_API_TOKEN (an
 * Editor-level token) in addition to STRIPE_WEBHOOK_SECRET — without
 * both set, this just logs and returns.
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
    const productIds = session.metadata?.productIds?.split(",").filter(Boolean) ?? [];

    if (productIds.length === 0) {
      console.warn("checkout.session.completed with no productIds metadata", session.id);
    } else if (!sanityWriteClient) {
      console.error(
        "SANITY_API_TOKEN not set — could not mark products sold:",
        productIds,
      );
    } else {
      const client = sanityWriteClient;
      await Promise.all(
        productIds.map((id) =>
          client
            .patch(id)
            .set({ sold: true })
            .commit()
            .catch((err) =>
              console.error(`Failed to mark product ${id} sold`, err),
            ),
        ),
      );
    }
  }

  return NextResponse.json({ received: true });
}
