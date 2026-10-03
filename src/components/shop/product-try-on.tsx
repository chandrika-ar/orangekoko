"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { TryOnStage } from "@/components/atelier/try-on/try-on-stage";
import { preloadFaceTracking } from "@/components/atelier/try-on/face-tracking";
import type { JourneyItem } from "@/components/atelier/journey/types";
import type { Product } from "@/lib/products";

/** Reuses the same camera + face-tracking overlay built for the 3D atelier's
 * try-on room (see src/components/atelier/try-on), now surfaced directly on
 * the product page instead of requiring the full room walkthrough. */
export function ProductTryOn({
  product,
  priceLabel,
}: {
  product: Product;
  priceLabel: string;
}) {
  const t = useTranslations("atelierJourney");
  const [open, setOpen] = useState(false);

  // Starts the face-tracking model/WASM download as soon as the product
  // page itself has settled, not just once the try-on modal opens — by
  // the time someone's actually read the page and clicked "try this piece
  // on", the download already has a multi-second head start instead of
  // starting from zero right when they open the camera. Deferred via
  // requestIdleCallback (falling back to a short timeout on browsers that
  // don't have it, e.g. Safari) so it doesn't compete with the page's own
  // images/fonts for bandwidth during the critical initial render.
  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => preloadFaceTracking());
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => preloadFaceTracking(), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const item: JourneyItem = {
    slug: product.slug,
    title: product.title,
    priceLabel,
    category: product.category,
    imageUrl: product.imageUrls?.[0],
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-accent px-6 py-3.5 text-xs uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-white"
      >
        {t("tryOnCta")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label={t("cameraHeading")}
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 px-4">
            <div className="relative bg-cream p-5 shadow-xl">
              <button
                aria-label="Close"
                className="absolute right-3 top-3 text-ink-soft transition-colors hover:text-ink"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
              <p className="pr-6 text-center text-sm text-ink-soft">
                {t("tryingOn")} <strong className="text-ink">{product.title}</strong>
              </p>
              <div className="mt-4">
                <TryOnStage item={item} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
