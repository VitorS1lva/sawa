/**
 * Endereço da API Django (ex.: "http://localhost:8000").
 * Defina NEXT_PUBLIC_API_URL em frontend/.env.local para usar o back-end de verdade.
 * Sem ela, tudo responde com dados de exemplo (mocks.ts).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * O que o back-end já oferece. Ligue cada área quando o Django tiver os endpoints dela;
 * as demais continuam com dados de exemplo, mesmo com a API configurada.
 */
const backendReady = {
  auth: true,
  account: true,
  market: false, // bolsas, ações, previsões, Selic e notícias
  chat: false,
  favorites: false,
};

export type ApiArea = keyof typeof backendReady;

/** `true` quando esta área deve usar os dados de exemplo. */
export function mocked(area: ApiArea): boolean {
  return API_URL === "" || !backendReady[area];
}

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
  auth: {
    signup: "/api/auth/cadastro/",
    verifyCode: "/api/auth/verificar-codigo/",
    resendCode: "/api/auth/reenviar-codigo/",
    login: "/api/auth/login/",
    refresh: "/api/auth/token/renovar/",
    logout: "/api/auth/sair/",
    /** GET dados do usuário logado; DELETE exclui a conta. */
    me: "/api/auth/eu/",
  },
};
