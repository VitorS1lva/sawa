"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAccount } from "./account";
import { sendChatMessage } from "./chat";
import { getFavorites, setFavorite } from "./favorites";
import { getExchanges, getNews, getProjection, getSelicProjection, getStocks } from "./market";
import type { FavoriteKind, Favorites } from "./types";

/*
 * Hooks do TanStack Query. Os componentes usam só estes hooks,
 * então trocar os mocks pela API não muda nada na interface.
 */

export const queryKeys = {
  exchanges: ["exchanges"] as const,
  stocks: (exchangeId: string) => ["stocks", exchangeId] as const,
  projection: (ticker: string) => ["projection", ticker] as const,
  favorites: ["favorites"] as const,
  selicProjection: ["projection", "selic"] as const,
  news: (topic: string) => ["news", topic] as const,
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

/** Só busca quando `enabled` (a tela da Selic está aberta). */
export function useSelicProjection(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.selicProjection, queryFn: getSelicProjection, enabled });
}

export function useNews(topic: string | null) {
  return useQuery({
    queryKey: queryKeys.news(topic ?? ""),
    queryFn: () => getNews(topic!),
    enabled: topic !== null,
  });
}

export function useFavorites() {
  return useQuery({ queryKey: queryKeys.favorites, queryFn: getFavorites });
}

type FavoriteChange = { kind: FavoriteKind; id: string; favorite: boolean };

/**
 * Marca ou desmarca um favorito. A estrela muda na hora (atualização otimista)
 * e volta ao estado anterior se a API falhar.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, id, favorite }: FavoriteChange) => setFavorite(kind, id, favorite),
    onMutate: async ({ kind, id, favorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites });
      const previous = queryClient.getQueryData<Favorites>(queryKeys.favorites);
      queryClient.setQueryData<Favorites>(queryKeys.favorites, (current) => {
        const base = current ?? { exchanges: [], stocks: [] };
        const ids = base[kind].filter((value) => value !== id);
        return { ...base, [kind]: favorite ? [...ids, id] : ids };
      });
      return { previous };
    },
    onError: (_error, _change, context) => {
      queryClient.setQueryData(queryKeys.favorites, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: deleteAccount });
}

export function useSendChatMessage() {
  return useMutation({ mutationFn: sendChatMessage });
}
