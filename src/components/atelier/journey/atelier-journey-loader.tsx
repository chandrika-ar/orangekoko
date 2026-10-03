"use client";

import dynamic from "next/dynamic";
import { LoadingVeil } from "@/components/atelier/three/loading-veil";
import type { CategoryRoom } from "./get-journey-items";

// `ssr: false` can only be passed to next/dynamic from inside a Client
// Component in this Next.js version — the two atelier pages are Server
// Components, so this wrapper exists purely to hold that call.
const AtelierJourney = dynamic(() => import("./atelier-journey"), {
  ssr: false,
  loading: () => <LoadingVeil />,
});

export function AtelierJourneyLoader({ rooms }: { rooms: CategoryRoom[] }) {
  return <AtelierJourney rooms={rooms} />;
}
