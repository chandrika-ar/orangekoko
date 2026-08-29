import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId } from "../env";

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      perspective: "published",
    })
  : null;

/**
 * Server-only write client — used to mark a product sold after a
 * successful Stripe payment. Requires SANITY_API_TOKEN (an Editor-level
 * token from Sanity → API → Tokens), which is separate from the public
 * read-only NEXT_PUBLIC_SANITY_PROJECT_ID and never sent to the browser.
 */
export const sanityWriteClient: SanityClient | null =
  isSanityConfigured && process.env.SANITY_API_TOKEN
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false,
        token: process.env.SANITY_API_TOKEN,
      })
    : null;
