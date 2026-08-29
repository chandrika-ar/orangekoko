import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { pool, isDbConfigured } from "@/lib/db";

const isEmailConfigured = Boolean(process.env.AUTH_RESEND_KEY);

export const isAuthConfigured = isDbConfigured && isEmailConfigured;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: pool ? PostgresAdapter(pool) : undefined,
  providers: isEmailConfigured
    ? [
        Resend({
          apiKey: process.env.AUTH_RESEND_KEY,
          from: process.env.AUTH_EMAIL_FROM || "orangekoko <onboarding@resend.dev>",
        }),
      ]
    : [],
  // Falls back to JWT sessions (no database calls) until Postgres + Resend
  // are both configured, so /api/auth/session never touches a missing
  // adapter — it simply reports "signed out" everywhere.
  session: { strategy: isAuthConfigured ? "database" : "jwt" },
  // NextAuth refuses to run at all without a secret. Before AUTH_SECRET is
  // set, no one can actually sign in anyway (no email provider yet), so a
  // fixed placeholder just keeps /api/auth/session from 500ing site-wide.
  secret: process.env.AUTH_SECRET || "orangekoko-unconfigured-placeholder-secret",
  trustHost: true,
});
