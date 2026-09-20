export interface JourneyItem {
  slug: string;
  title: string;
  priceLabel: string;
  category: "earrings-studs" | "ear-clips" | "necklaces";
  /** Real photo, when the catalogue has one (absent for local sample data). */
  imageUrl?: string;
}

export type JourneyStage = "room" | "door" | "tryon";
