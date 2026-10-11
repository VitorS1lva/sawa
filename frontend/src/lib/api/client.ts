import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { createLogger, printBackendTrace } from "@/lib/log/logger";
import { API_URL, endpoints } from "./config";

const log = createLogger("api.client");

/** Cliente HTTP único da aplicação. */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

let accessToken: string | null = null;

/** Guarda o token JWT de acesso; ele passa a ir em todas as requisições. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/*
 * Log de cada requisição. Cada uma leva um id (X-Request-ID) que o Django usa nos logs dele,
 * e a resposta traz esses logs (X-Trace), impressos agrupados sob a linha da resposta.
 */

type TracedConfig = InternalAxiosRequestConfig & { _requestId?: string; _startedAt?: number };

function newRequestId(): string {
  return globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(16).slice(2, 10);
}

const describe = (config: InternalAxiosRequestConfig) => `${config.method?.toUpperCase()} ${config.url}`;

api.interceptors.request.use((config: TracedConfig) => {
  config._requestId = newRequestId();
  config._startedAt = performance.now();
  config.headers["X-Request-ID"] = config._requestId;

  // Só os nomes dos campos: os valores podem ter senha.
  const fields = config.data && typeof config.data === "object" ? Object.keys(config.data).join(", ") : "";
  const auth = config.headers.Authorization ? "com" : "sem";
  log.debug(
    "request",
    `→ ${describe(config)} (requisição ${config._requestId}, ${auth} token${fields ? `, campos: ${fields}` : ""})`,
  );
  return config;
});

function logResponse(config: TracedConfig | undefined, response: AxiosResponse | undefined) {
  if (!config) return;
  const elapsed = config._startedAt === undefined ? 0 : Math.round(performance.now() - config._startedAt);
  if (!response) {
    log.error("response", `✕ ${describe(config)} sem resposta do servidor após ${elapsed} ms (fora do ar ou CORS?)`);
    return;
  }
  const { status } = response;
  const level = status >= 500 ? "ERROR" : status >= 400 ? "WARNING" : "INFO";
  const grouped = log.group(level, "response", `← ${describe(config)} respondeu ${status} em ${elapsed} ms`);
  printBackendTrace(response.headers["x-trace"]);
  if (grouped) log.groupEnd();
}

api.interceptors.response.use(
  (response) => {
    logResponse(response.config, response);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) logResponse(error.config, error.response);
    throw error;
  },
);

/*
 * Token expirado: o access dura 15 minutos. Ao receber 401, renova a sessão uma vez
 * (veja lib/auth/session.ts) e repete a requisição. Rotas que emitem tokens ficam de fora.
 */

let renewSession: (() => Promise<boolean>) | null = null;

/** Registrado pela sessão, para o cliente não depender dela (evita import circular). */
export function setSessionRenewer(renewer: () => Promise<boolean>) {
  renewSession = renewer;
}

const noRetry = new Set<string>([
  endpoints.auth.signup,
  endpoints.auth.verifyCode,
  endpoints.auth.resendCode,
  endpoints.auth.login,
  endpoints.auth.refresh,
  endpoints.auth.logout,
]);

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config as RetriableConfig | undefined;
  const canRetry = config && !config._retried && !noRetry.has(config.url ?? "") && renewSession;

  if (error.response?.status === 401 && canRetry) {
    config._retried = true;
    log.info("retryAfterRenew", `Token expirado em ${describe(config)}; renovando a sessão e repetindo`);
    if (await renewSession!()) return api(config);
  }
  throw error;
});
