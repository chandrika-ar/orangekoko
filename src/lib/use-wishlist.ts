"use client";

import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useServerWishlistStore } from "@/store/server-wishlist-store";

/**
 * Anonymous visitors keep their wishlist in localStorage (useWishlistStore).
 * Signed-in visitors get a server-backed wishlist tied to their account
 * instead, fetched from /api/wishlist — the two are not merged on sign-in.
 * Both stores are shared singletons so every component reflects the same
 * state — toggling the heart in one place updates it everywhere, including
 * the header's wishlist count.
 */
export function useWishlist() {
  const { status } = useSession();
  const authenticated = status === "authenticated";

  const localIds = useWishlistStore((s) => s.productIds);
  const localToggle = useWishlistStore((s) => s.toggle);

  const serverIds = useServerWishlistStore((s) => s.productIds);
  const serverLoaded = useServerWishlistStore((s) => s.loaded);
  const setServerIds = useServerWishlistStore((s) => s.setProductIds);
  const serverToggle = useServerWishlistStore((s) => s.toggle);

  useEffect(() => {
    if (!authenticated || serverLoaded) return;
    let cancelled = false;
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setServerIds(data.productIds ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, serverLoaded, setServerIds]);

  const productIds = authenticated ? serverIds : localIds;

  const toggle = useCallback(
    (productId: string) => {
      if (!authenticated) {
        localToggle(productId);
        return;
      }
      serverToggle(productId);
    },
    [authenticated, localToggle, serverToggle],
  );

  const has = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  );

  return { productIds, toggle, has };
}
