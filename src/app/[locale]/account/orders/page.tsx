import { getTranslations, getLocale } from "next-intl/server";
import { auth, isAuthConfigured } from "@/auth";
import { pool } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/products";

interface OrderLineItem {
  title: string | null;
  amountCents: number | null;
  currency: string;
  quantity: number | null;
}

interface OrderRow {
  id: number;
  stripe_session_id: string;
  status: string;
  amount_total_cents: number;
  currency: string;
  line_items: OrderLineItem[];
  created_at: string;
}

export default async function OrdersPage() {
  const t = await getTranslations("orders");
  const locale = await getLocale();

  const session = isAuthConfigured ? await auth() : null;
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const orders: OrderRow[] =
    pool && userId
      ? (
          await pool.query<OrderRow>(
            `SELECT id, stripe_session_id, status, amount_total_cents, currency, line_items, created_at
             FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId],
          )
        ).rows
      : [];

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl">{t("title")}</h1>

      {orders.length === 0 ? (
        <>
          <p className="mt-3 text-sm text-ink-soft">{t("empty")}</p>
          <p className="text-sm text-ink-soft">{t("emptyBody")}</p>
        </>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {orders.map((order) => (
            <li key={order.id} className="py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  {t("placedOn", { date: dateFormatter.format(new Date(order.created_at)) })}
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                  {t(`status_${order.status}` as "status_paid" | "status_refunded")}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {order.line_items.map((item, i) => (
                  <li key={i}>
                    {item.title}
                    {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{t("total")}</span>
                <span>{formatPrice(order.amount_total_cents, order.currency.toUpperCase(), locale)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/account"
        className="mt-8 inline-block border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
      >
        {t("backToAccount")}
      </Link>
    </div>
  );
}
