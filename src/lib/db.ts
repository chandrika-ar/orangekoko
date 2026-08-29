import { Pool } from "pg";

export const isDbConfigured = Boolean(process.env.POSTGRES_URL);

export const pool: Pool | null = isDbConfigured
  ? new Pool({ connectionString: process.env.POSTGRES_URL })
  : null;
