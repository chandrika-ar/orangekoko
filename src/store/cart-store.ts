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
  maxQuantity?: number;
  dispatchBy?: string;
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
          const max = item.maxQuantity ?? 1;
          if (max < 1) return {};
          if (state.lines.some((l) => l.productId === item.productId)) {
            return { lines: state.lines.map((line) => line.productId === item.productId ? { ...line, maxQuantity: max, quantity: Math.min(line.quantity + 1, max) } : line), isOpen: true };
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
      setQuantity: (productId, quantity) => set((state) => ({
        lines: state.lines.map((line) => line.productId === productId ? { ...line, quantity: Math.max(1, Math.min(Number.isFinite(quantity) ? Math.floor(quantity) : 1, line.maxQuantity ?? 1)) } : line),
      })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: "orangekoko-cart", version: 2, migrate: () => ({ lines: [], isOpen: false }) },
  ),
);

export function cartSubtotalCents(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}
