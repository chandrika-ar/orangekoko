"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export function SignInForm() {
  const t = useTranslations("account");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (status === "sent") {
    return <p className="text-accent">{t("checkEmail")}</p>;
  }

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus("sending");
          const res = await signIn("resend", {
            email,
            redirect: false,
            callbackUrl: window.location.pathname,
          });
          setStatus(res?.error ? "error" : "sent");
        }}
        className="flex max-w-sm gap-2"
      >
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="w-full min-w-0 border border-line bg-cream px-3 py-2.5 text-sm placeholder:text-ink-soft focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 bg-ink px-5 py-2.5 text-xs uppercase tracking-[0.1em] text-white transition-colors hover:bg-accent disabled:opacity-50"
        >
          {t("sendLink")}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">{t("signInError")}</p>
      )}
    </div>
  );
}
