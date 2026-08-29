"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (item: Omit<CartLine, "quantity">) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          // Every piece is one-of-one: quantity is always capped at 1.
          if (state.lines.some((l) => l.productId === item.productId)) {
            return { isOpen: true };
          }
          return {
            lines: [...state.lines, { ...item, quantity: 1 }],
            isOpen: true,
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),
      setQuantity: () => {
        // No-op: one-of-one inventory means quantity is always 1.
      },
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: "orangekoko-cart" },
  ),
);

export function cartSubtotalCents(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}
