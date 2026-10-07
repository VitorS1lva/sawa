/**
 * Endereço da API Django (ex.: "http://localhost:8000").
 * Defina NEXT_PUBLIC_API_URL em frontend/.env.local para usar o back-end de verdade.
 * Sem ela, os serviços respondem com dados de exemplo (mocks.ts).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const USE_MOCKS = API_URL === "";

/** Caminhos da API. Ajuste aqui se as rotas do Django mudarem. */
export const endpoints = {
  exchanges: "/api/bolsas/",
  stocks: "/api/ativos/", // ?bolsa=B3
  projection: (ticker: string) => `/api/ativos/${encodeURIComponent(ticker)}/previsao/`,
  selicProjection: "/api/selic/previsao/",
  news: "/api/noticias/", // ?tema=selic
  chat: "/api/chat/",
  /** GET lista; POST { kind, id } adiciona. */
  favorites: "/api/favoritos/",
  /** DELETE remove um favorito. */
  favorite: (kind: string, id: string) => `/api/favoritos/${kind}/${encodeURIComponent(id)}/`,
  /** DELETE exclui a conta do usuário logado. */
  account: "/api/conta/",
};
