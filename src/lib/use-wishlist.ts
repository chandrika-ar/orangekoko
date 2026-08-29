"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/store/wishlist-store";

/**
 * Anonymous visitors keep their wishlist in localStorage (useWishlistStore).
 * Signed-in visitors get a server-backed wishlist tied to their account
 * instead, fetched from /api/wishlist — the two are not merged on sign-in.
 */
export function useWishlist() {
  const { status } = useSession();
  const authenticated = status === "authenticated";

  const localIds = useWishlistStore((s) => s.productIds);
  const localToggle = useWishlistStore((s) => s.toggle);
  const [serverIds, setServerIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setServerIds(data.productIds ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const productIds = authenticated ? serverIds : localIds;

  const toggle = useCallback(
    (productId: string) => {
      if (!authenticated) {
        localToggle(productId);
        return;
      }
      const removing = serverIds.includes(productId);
      setServerIds((prev) =>
        removing ? prev.filter((id) => id !== productId) : [...prev, productId],
      );
      fetch("/api/wishlist", {
        method: removing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    },
    [authenticated, serverIds, localToggle],
  );

  const has = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  );

  return { productIds, toggle, has };
}
