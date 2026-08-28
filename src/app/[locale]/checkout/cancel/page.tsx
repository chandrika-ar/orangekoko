import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function CheckoutCancelPage() {
  const t = await getTranslations("checkout");
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">{t("cancelTitle")}</h1>
      <p className="mt-4 text-sm text-ink-soft">{t("cancelBody")}</p>
      <Link
        href="/cart"
        className="mt-8 inline-block border border-ink px-6 py-2.5 text-xs uppercase tracking-[0.12em] hover:bg-ink hover:text-white"
      >
        {t("backToShop")}
      </Link>
    </div>
  );
}
