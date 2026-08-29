"use client";

import { createContext, useContext } from "react";

const CurrencyRatesContext = createContext<Record<string, number>>({ EUR: 1 });

export function CurrencyRatesProvider({
  rates,
  children,
}: {
  rates: Record<string, number>;
  children: React.ReactNode;
}) {
  return (
    <CurrencyRatesContext.Provider value={rates}>
      {children}
    </CurrencyRatesContext.Provider>
  );
}

export function useCurrencyRates() {
  return useContext(CurrencyRatesContext);
}
