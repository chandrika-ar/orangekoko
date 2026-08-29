import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !pool) {
    return NextResponse.json({ productIds: [] });
  }
  const { rows } = await pool.query(
    "SELECT product_id FROM wishlists WHERE user_id = $1",
    [session.user.id],
  );
  return NextResponse.json({ productIds: rows.map((r) => r.product_id) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!pool) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { productId } = await req.json();
  await pool.query(
    "INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [session.user.id, productId],
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!pool) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { productId } = await req.json();
  await pool.query(
    "DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2",
    [session.user.id, productId],
  );
  return NextResponse.json({ ok: true });
}
