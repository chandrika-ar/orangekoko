export interface JourneyItem {
  slug: string;
  title: string;
  priceLabel: string;
  category: "earrings-studs" | "ear-clips" | "necklaces";
}

export type JourneyStage = "room" | "door" | "tryon";
