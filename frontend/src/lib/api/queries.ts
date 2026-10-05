"use client";

import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { sendChatMessage } from "./chat";
import { getExchanges, getProjection, getStocks } from "./market";

/*
 * Hooks do TanStack Query. Os componentes usam só estes hooks,
 * então trocar os mocks pela API não muda nada na interface.
 */

export const queryKeys = {
  exchanges: ["exchanges"] as const,
  stocks: (exchangeId: string) => ["stocks", exchangeId] as const,
  projection: (ticker: string) => ["projection", ticker] as const,
};

export function useExchanges() {
  return useQuery({ queryKey: queryKeys.exchanges, queryFn: getExchanges });
}

export function useStocks(exchangeId: string | null) {
  return useQuery({
    queryKey: queryKeys.stocks(exchangeId ?? ""),
    queryFn: () => getStocks(exchangeId!),
    enabled: exchangeId !== null,
  });
}

/** Uma consulta por ação; cada uma fica em cache separadamente. */
export function useProjections(tickers: string[]) {
  return useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: queryKeys.projection(ticker),
      queryFn: () => getProjection(ticker),
    })),
  });
}

export function useSendChatMessage() {
  return useMutation({ mutationFn: sendChatMessage });
}
