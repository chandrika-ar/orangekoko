export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

// Project ID is not secret (it's shipped to the browser regardless), so it's
// safe to default it here rather than requiring a Vercel env var for it.
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "j4yid7ik";

/** True once a real Sanity project is configured; false falls back to local sample data. */
export const isSanityConfigured = Boolean(projectId);
