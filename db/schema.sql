-- Run this once against the project's Postgres database (Vercel Storage ->
-- your database -> Query tab, or any Postgres client) before customer
-- accounts / sign-in will work. Safe to re-run: every statement is
-- idempotent.

CREATE TABLE IF NOT EXISTS verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS accounts
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users
(
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  PRIMARY KEY (id)
);

-- Custom table (not part of Auth.js's own schema) linking signed-in
-- customers to the products they've saved to their wishlist.
CREATE TABLE IF NOT EXISTS wishlists
(
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- Custom table recording completed orders, written by the Stripe webhook.
-- user_id is only set when the customer was signed in at checkout, which is
-- what makes order history available on their account. Guest checkouts
-- still write a row (user_id NULL) so sold-inventory bookkeeping stays in
-- one place, but they won't show up under any account.
CREATE TABLE IF NOT EXISTS orders
(
  id SERIAL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  stripe_session_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'paid',
  amount_total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  line_items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
