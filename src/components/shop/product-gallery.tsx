"use client";

import { useState } from "react";
import { ImagePlaceholder } from "@/components/image-placeholder";

export function ProductGallery({
  title,
  imageCount,
}: {
  title: string;
  imageCount: number;
}) {
  const [active, setActive] = useState(0);
  const slots = Array.from({ length: imageCount });

  return (
    <div>
      <ImagePlaceholder
        label={`${title} — photo ${active + 1} of ${imageCount}`}
        aspect="aspect-square"
      />
      {imageCount > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {slots.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`border ${
                active === i ? "border-ink" : "border-line"
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              <ImagePlaceholder label={`${i + 1}`} aspect="aspect-square" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
