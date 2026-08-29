"use client";

import dynamic from "next/dynamic";
import config from "../../../../sanity.config";

// Sanity Studio is a heavy client-only SPA — it isn't SSR-safe, so it must
// be excluded from server rendering entirely rather than just externalized.
const NextStudio = dynamic(
  () => import("next-sanity/studio").then((mod) => mod.NextStudio),
  { ssr: false },
);

export default function StudioPage() {
  return <NextStudio config={config} />;
}
