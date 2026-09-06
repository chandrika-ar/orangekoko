import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { StorySection } from "@/components/home/story-section";
import { NewArrivalsRail } from "@/components/home/new-arrivals-rail";
import { ConditionSection } from "@/components/home/condition-section";
import { FeaturesRow } from "@/components/home/features-row";
import { AtelierEntryBanner } from "@/components/home/atelier-entry-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AtelierEntryBanner />
      <CategoryGrid />
      <StorySection />
      <NewArrivalsRail />
      <ConditionSection />
      <FeaturesRow />
    </>
  );
}
