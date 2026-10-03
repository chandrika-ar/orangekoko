"use client";

import { create } from "zustand";

interface ServerWishlistState {
  productIds: string[];
  loaded: boolean;
  setProductIds: (ids: string[]) => void;
  toggle: (productId: string) => void;
}

export const useServerWishlistStore = create<ServerWishlistState>((set, get) => ({
  productIds: [],
  loaded: false,
  setProductIds: (ids) => set({ productIds: ids, loaded: true }),
  toggle: (productId) => {
    const removing = get().productIds.includes(productId);
    set((state) => ({
      productIds: removing
        ? state.productIds.filter((id) => id !== productId)
        : [...state.productIds, productId],
    }));
    fetch("/api/wishlist", {
      method: removing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
  },
}));
