"use client";

import dynamic from "next/dynamic";
import { LoadingVeil } from "@/components/atelier/three/loading-veil";
import type { JourneyItem } from "./types";

// `ssr: false` can only be passed to next/dynamic from inside a Client
// Component in this Next.js version — the two atelier pages are Server
// Components, so this wrapper exists purely to hold that call.
const AtelierJourney = dynamic(() => import("./atelier-journey"), {
  ssr: false,
  loading: () => <LoadingVeil />,
});

export function AtelierJourneyLoader({ items }: { items: JourneyItem[] }) {
  return <AtelierJourney items={items} />;
}
