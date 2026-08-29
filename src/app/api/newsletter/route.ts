import { NextRequest, NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/lib/client";
import { routing } from "@/i18n/routing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NewsletterRequestBody {
  email: string;
  locale?: string;
}

export async function POST(req: NextRequest) {
  let body: NewsletterRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const locale = routing.locales.includes(body.locale as never)
    ? body.locale
    : routing.defaultLocale;

  if (!sanityWriteClient) {
    // No SANITY_API_TOKEN configured yet — nothing can be stored.
    return NextResponse.json(
      { error: "Newsletter signup isn't connected yet." },
      { status: 503 },
    );
  }

  try {
    const existing = await sanityWriteClient.fetch<string | null>(
      `*[_type == "newsletterSubscriber" && email == $email][0]._id`,
      { email },
    );

    if (!existing) {
      await sanityWriteClient.create({
        _type: "newsletterSubscriber",
        email,
        locale,
        subscribedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Newsletter signup failed", err);
    return NextResponse.json(
      { error: "Could not save your email. Please try again." },
      { status: 500 },
    );
  }
}
