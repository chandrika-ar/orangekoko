import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { NewArrivalsRail } from "@/components/home/new-arrivals-rail";
import { FeaturesRow } from "@/components/home/features-row";
// AtelierEntryBanner (the "Step inside the atelier" / 3D room section) is
// paused for now — try-on moved to individual product pages instead (see
// ProductTryOn). The component and its /atelier/* routes are untouched,
// just not linked from the homepage, so this can come back later.
// import { AtelierEntryBanner } from "@/components/home/atelier-entry-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <NewArrivalsRail />
      <FeaturesRow />
    </>
  );
}
