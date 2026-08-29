import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProductBySlug } from "@/lib/products";
import { SHIPPABLE_COUNTRIES, toStripeShippingOptions } from "@/lib/shipping";
import { routing } from "@/i18n/routing";

interface CheckoutRequestBody {
  slugs: string[];
  locale: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const locale = routing.locales.includes(body.locale as never)
    ? body.locale
    : routing.defaultLocale;

  if (!Array.isArray(body.slugs) || body.slugs.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Prices and availability are always resolved server-side from the
  // product catalogue — never trust amounts sent from the client.
  const lineItems = [];
  for (const slug of body.slugs) {
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${slug}` },
        { status: 400 },
      );
    }
    if (product.sold) {
      return NextResponse.json(
        { error: `"${product.title}" has already sold.` },
        { status: 409 },
      );
    }
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: product.currency.toLowerCase(),
        unit_amount: product.priceCents,
        product_data: { name: product.title },
      },
    });
  }

  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + item.price_data.unit_amount * item.quantity,
    0,
  );

  try {
    const stripe = getStripe();
    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // Payment methods shown at checkout (cards, iDEAL, Bancontact, SEPA
      // Debit, Klarna, etc.) are controlled in the Stripe Dashboard under
      // Settings → Payment methods — no need to list them here.
      shipping_address_collection: {
        allowed_countries: [...SHIPPABLE_COUNTRIES],
      },
      shipping_options: toStripeShippingOptions(subtotalCents),
      success_url: `${origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
