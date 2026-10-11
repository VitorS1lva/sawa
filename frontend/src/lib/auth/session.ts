import { refreshTokens } from "@/lib/api/auth";
import { setAccessToken, setSessionRenewer } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { AuthTokens } from "@/lib/api/types";
import { createLogger } from "@/lib/log/logger";

const log = createLogger("auth.session");

/*
 * Tokens da sessão.
 * - access (15 min): só em memória, vai em cada requisição.
 * - refresh (7 dias): no localStorage, para a sessão sobreviver ao recarregar a página.
 *   Ele gira a cada renovação (o anterior deixa de valer no servidor).
 */

const REFRESH_KEY = "sawa:refresh";

function readRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function writeRefresh(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Sem localStorage (ex.: janela anônima bloqueada): a sessão vale só até recarregar.
  }
}

let memoryRefresh: string | null = null;

export function getRefreshToken(): string | null {
  return memoryRefresh ?? readRefresh();
}

export function hasStoredSession(): boolean {
  return getRefreshToken() !== null;
}

export function startSession({ access, refresh }: AuthTokens) {
  log.info("startSession", "Sessão iniciada: access token em memória, refresh token no localStorage");
  setAccessToken(access);
  memoryRefresh = refresh;
  writeRefresh(refresh);
}

export function clearSession() {
  log.info("clearSession", "Sessão encerrada: tokens apagados da memória e do localStorage");
  setAccessToken(null);
  memoryRefresh = null;
  writeRefresh(null);
}

/* ---------- Sessão expirada ---------- */

const expiredListeners = new Set<() => void>();

/** Avisa quando a sessão acaba sem o usuário pedir (refresh vencido ou conta excluída). */
export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

let renewing: Promise<boolean> | null = null;

/**
 * Pede tokens novos com o refresh. Várias requisições com 401 ao mesmo tempo
 * compartilham a mesma renovação (o refresh só pode ser usado uma vez).
 */
export function renewSession(): Promise<boolean> {
  renewing ??= (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      log.debug("renewSession", "Sem refresh token guardado; nada a renovar");
      return false;
    }
    try {
      startSession(await refreshTokens(refresh));
      return true;
    } catch (error) {
      // Sem conexão: mantém o refresh para tentar de novo depois.
      if (toApiError(error).code === "network") {
        log.warn("renewSession", "Servidor fora do ar; o refresh token fica guardado para tentar depois");
        return false;
      }
      log.warn("renewSession", "Refresh token recusado (vencido ou conta excluída); encerrando a sessão");
      clearSession();
      expiredListeners.forEach((listener) => listener());
      return false;
    }
  })().finally(() => {
    renewing = null;
  });
  return renewing;
}

setSessionRenewer(renewSession);
