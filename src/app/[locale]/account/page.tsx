import { getTranslations } from "next-intl/server";
import { auth, signOut, isAuthConfigured } from "@/auth";
import { Link } from "@/i18n/navigation";
import { SignInForm } from "@/components/account/sign-in-form";

export default async function AccountPage() {
  const t = await getTranslations("account");

  if (!isAuthConfigured) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <p className="mt-3 text-sm text-ink-soft">{t("notConfigured")}</p>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <p className="mt-3 text-sm text-ink-soft">{t("signInHint")}</p>
        <div className="mt-6">
          <SignInForm />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        {t("signedInAs", { email: session.user.email ?? "" })}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/wishlist"
          className="w-fit border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
        >
          {t("viewWishlist")}
        </Link>
        <Link
          href="/account/orders"
          className="w-fit border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
        >
          {t("viewOrders")}
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/account" });
          }}
        >
          <button
            type="submit"
            className="border-b border-ink pb-0.5 text-xs uppercase tracking-[0.1em]"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
