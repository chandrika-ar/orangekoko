import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProductBySlug } from "@/lib/products";
import { SHIPPABLE_COUNTRIES, toStripeShippingOptions } from "@/lib/shipping";
import { routing } from "@/i18n/routing";
import { randomUUID } from "node:crypto";
import { normalizeCartLines, validatePurchase, cardOrderAllowed, purchaseTotalCents } from "@/lib/commerce";
import { reserveInventory } from "@/lib/inventory-reservations";
import { sanityWriteClient } from "@/sanity/lib/client";
import { auth } from "@/auth";

interface CheckoutRequestBody {
  items?: unknown;
  slugs?: string[];
  locale: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const locale = routing.locales.includes(body.locale as never)
    ? body.locale
    : routing.defaultLocale;

  let requested;
  try {
    requested = normalizeCartLines(body.items ?? (Array.isArray(body.slugs) ? body.slugs.map((slug) => ({ slug, quantity: 1 })) : undefined));
  } catch {
    return NextResponse.json({ error: "Invalid cart or quantity" }, { status: 400 });
  }
  if (!sanityWriteClient || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Checkout inventory is not configured" }, { status: 503 });
  }
  const items = [];
  const lineItems = [];
  const dispatchDates: string[] = [];
  for (const { slug, quantity } of requested) {
    const product = await getProductBySlug(slug, { fresh: true });
    if (!product || !product.revision) return NextResponse.json({ error: "Product unavailable" }, { status: 409 });
    try { validatePurchase(product, quantity); }
    catch { return NextResponse.json({ error: "Item is unavailable or requested quantity exceeds stock" }, { status: 409 }); }
    items.push({ product, quantity });
    if (product.fulfilment === "preorder" && product.dispatchBy) dispatchDates.push(product.dispatchBy);
    const threePrice = product.category === "handmade-cards" ? product.threeCardPriceCents : undefined;
    const discounted = purchaseTotalCents(product.priceCents, quantity, threePrice) < product.priceCents * quantity;
    const groups = discounted ? Math.floor(quantity / 3) : 0;
    if (groups) lineItems.push({quantity: groups, price_data: {currency: product.currency.toLowerCase(), unit_amount: threePrice!, product_data: {name: `${product.title} × 3`, ...(product.fulfilment === "preorder" ? { description: `Preorder — dispatch by ${product.dispatchBy}` } : {})}}});
    const singles = discounted ? quantity % 3 : quantity;
    if (singles) lineItems.push({ quantity: singles, price_data: {
      currency: product.currency.toLowerCase(), unit_amount: product.priceCents,
      product_data: { name: product.title, ...(product.fulfilment === "preorder" ? { description: `Preorder — dispatch by ${product.dispatchBy}` } : {}) },
    }});
  }
  if (!cardOrderAllowed(items.map(({product,quantity}) => ({category: product.category, packSize: product.packSize, quantity})))) return NextResponse.json({error: "Card-only orders require at least two cards", code: "MINIMUM_CARDS"}, {status: 400});
  if (lineItems.length > 100) return NextResponse.json({error: "Too many checkout lines; please split this order"}, {status: 400});
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
  const cancellationToken = randomUUID();
  const reservationId = `inventory-reservation-${randomUUID()}`;

  try {
    const stripe = getStripe();
    const origin = req.nextUrl.origin;
    const authSession = await auth();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: lineItems,
      // Payment methods shown at checkout (cards, iDEAL, Bancontact, SEPA
      // Debit, Klarna, etc.) are controlled in the Stripe Dashboard under
      // Settings → Payment methods — no need to list them here.
      shipping_address_collection: {
        allowed_countries: [...SHIPPABLE_COUNTRIES],
      },
      shipping_options: toStripeShippingOptions(subtotalCents, dispatchDates.length > 0),
      success_url: `${origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout/cancel?reservation=${reservationId}`,
      // Read back by the webhook to mark exactly these products sold, and
      // to attribute the order to an account for order-history purposes
      // (only when the customer was signed in at checkout).
      metadata: {
        cancellationToken,
        inventoryReservation: reservationId,
        dispatchBy: dispatchDates.sort().at(-1) ?? "",
        userId: authSession?.user?.id ?? "",
      },
    });

    try {
      await reserveInventory(reservationId, session.id, items);
    } catch (err) {
      console.error("Inventory reservation failed", err);
      await stripe.checkout.sessions.expire(session.id);
      return NextResponse.json({ error: "Stock changed. Please review your cart and try again." }, { status: 409 });
    }
    const response = NextResponse.json({ url: session.url });
    response.cookies.set(`orangekoko-checkout-${reservationId}`, JSON.stringify({ sessionId: session.id, token: cancellationToken }), { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 1800 });
    return response;
  } catch (err) {
    console.error("Stripe checkout session creation failed", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
