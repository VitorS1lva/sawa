"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/** Provedores usados no app inteiro. O devtools só aparece em desenvolvimento. */
export function Providers({ children }: { children: ReactNode }) {
  // Um QueryClient por navegador, criado uma única vez.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // As previsões são calculadas uma vez por dia (D-1), então podem ficar em cache.
          queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
