/*
 * Logs no console do navegador, no mesmo formato do back-end:
 *
 *   [INFO ~ 11-10-2026 | 14:22:01] front:api.auth.signup - Enviando cadastro de ana@exemplo.com
 *
 * - `createLogger("api.auth")` cria um logger para um módulo; cada chamada diz a função:
 *   `log.info("signup", "mensagem")`.
 * - `printBackendTrace` mostra os logs que o Django gerou numa requisição (cabeçalho X-Trace,
 *   veja backend/config/tracing.py), com o local prefixado por "back:".
 *
 * Nível mínimo em NEXT_PUBLIC_LOG_LEVEL (trace, debug, info, warning, error ou silent).
 * Nunca registre senhas, tokens ou o código de confirmação.
 */

const LEVELS = ["TRACE", "DEBUG", "INFO", "WARNING", "ERROR"] as const;
export type LogLevel = (typeof LEVELS)[number];

const COLORS: Record<LogLevel, string> = {
  TRACE: "color: #8a8f98",
  DEBUG: "color: #0ea5b7",
  INFO: "color: #16a34a",
  WARNING: "color: #d97706",
  ERROR: "color: #dc2626",
};

// console.log, e não console.debug: o Chrome esconde o debug por padrão (nível "Verbose").
const WRITERS: Record<LogLevel, (...data: unknown[]) => void> = {
  TRACE: console.log,
  DEBUG: console.log,
  INFO: console.info,
  WARNING: console.warn,
  ERROR: console.error,
};

function minLevel(): number {
  const configured = (process.env.NEXT_PUBLIC_LOG_LEVEL ?? "").toUpperCase();
  if (configured === "SILENT") return LEVELS.length;
  const index = LEVELS.indexOf(configured as LogLevel);
  if (index >= 0) return index;
  // Padrão: tudo em desenvolvimento, só avisos e erros em produção.
  return process.env.NODE_ENV === "production" ? LEVELS.indexOf("WARNING") : 0;
}

const threshold = minLevel();

function enabled(level: LogLevel): boolean {
  return LEVELS.indexOf(level) >= threshold;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** DD-MM-YYYY | HH:MM:SS, no fuso do navegador. */
function timestamp(date: Date): string {
  const day = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  return `${day} | ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Monta a linha no formato do projeto, com o nível colorido (%c). */
function format(level: LogLevel, date: Date, where: string, message: string): unknown[] {
  return [`[%c${level}%c ~ ${timestamp(date)}] %c${where}%c - ${message}`, COLORS[level], "", "font-weight: bold", ""];
}

function write(level: LogLevel, date: Date, where: string, message: string, extra: unknown[]) {
  if (!enabled(level)) return;
  WRITERS[level](...format(level, date, where, message), ...extra);
}

export type Logger = Record<
  "trace" | "debug" | "info" | "warn" | "error",
  (fn: string, message: string, ...extra: unknown[]) => void
> & {
  /** Agrupa os logs seguintes sob esta linha (no console, dá para recolher o grupo). */
  group: (level: LogLevel, fn: string, message: string) => boolean;
  groupEnd: () => void;
};

/** Logger de um módulo do front-end; o local sai como "front:<módulo>.<função>". */
export function createLogger(module: string): Logger {
  const where = (fn: string) => `front:${module}.${fn}`;
  const at =
    (level: LogLevel) =>
    (fn: string, message: string, ...extra: unknown[]) =>
      write(level, new Date(), where(fn), message, extra);

  return {
    trace: at("TRACE"),
    debug: at("DEBUG"),
    info: at("INFO"),
    warn: at("WARNING"),
    error: at("ERROR"),
    group(level, fn, message) {
      if (!enabled(level)) return false;
      console.group(...format(level, new Date(), where(fn), message));
      return true;
    },
    groupEnd: () => console.groupEnd(),
  };
}

/** Uma linha de log do back-end, como vem no cabeçalho X-Trace. */
type BackendEntry = { level: string; time: number; where: string; message: string };

function decodeTrace(header: string): BackendEntry[] {
  try {
    const bytes = Uint8Array.from(atob(header), (char) => char.charCodeAt(0));
    const entries = JSON.parse(new TextDecoder().decode(bytes));
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

/** Imprime os logs que o Django gerou durante uma requisição. */
export function printBackendTrace(header: string | undefined | null) {
  if (!header) return;
  for (const entry of decodeTrace(header)) {
    const level = entry.level === "CRITICAL" ? "ERROR" : LEVELS.find((name) => name === entry.level) ?? "INFO";
    write(level, new Date(entry.time), `back:${entry.where}`, entry.message, []);
  }
}
