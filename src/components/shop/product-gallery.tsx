"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/image-placeholder";

export function ProductGallery({
  title,
  imageCount,
  imageUrls,
}: {
  title: string;
  imageCount: number;
  imageUrls?: string[];
}) {
  const [active, setActive] = useState(0);
  const hasRealImages = Boolean(imageUrls && imageUrls.length > 0);
  const count = hasRealImages ? imageUrls!.length : imageCount;
  const slots = Array.from({ length: count });

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden border border-line bg-cream-deep">
        {hasRealImages ? (
          <Image
            src={imageUrls![active]}
            alt={`${title} — photo ${active + 1} of ${count}`}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={active === 0}
          />
        ) : (
          <ImagePlaceholder
            label={`${title} — photo ${active + 1} of ${count}`}
            aspect="aspect-square"
            className="absolute inset-0"
          />
        )}
      </div>
      {count > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {slots.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden border ${
                active === i ? "border-ink" : "border-line"
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              {hasRealImages ? (
                <Image
                  src={imageUrls![i]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              ) : (
                <ImagePlaceholder label={`${i + 1}`} aspect="aspect-square" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
