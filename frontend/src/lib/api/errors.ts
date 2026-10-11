import axios from "axios";

/**
 * Erro da API num formato único. O back-end responde `{ code, detail }` nos erros do fluxo
 * de autenticação e `{ campo: ["mensagem"] }` nos erros de validação.
 */
export class ApiError extends Error {
  status: number;
  /** Código estável para o front-end decidir o que fazer (ex.: "phone_not_verified"). */
  code?: string;
  /** Mensagens por campo do formulário. */
  fields: Record<string, string[]>;
  /** Corpo completo da resposta, para dados extras (ex.: o WhatsApp mascarado). */
  body: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    code?: string,
    fields: Record<string, string[]> = {},
    body: Record<string, unknown> = {},
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.body = body;
  }
}

/** Converte qualquer erro (do Axios ou não) em ApiError, com mensagem pronta para mostrar. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) return new ApiError(0, "Algo deu errado. Tente de novo.");
  if (!error.response) return new ApiError(0, "Não foi possível conectar ao servidor. Tente de novo.", "network");

  const { status, data } = error.response;
  if (status === 429) return new ApiError(status, "Muitas tentativas. Aguarde um pouco e tente de novo.", "throttled");

  const body = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) fields[key] = value.map(String);
  }
  const detail = typeof body.detail === "string" ? body.detail : Object.values(fields)[0]?.[0];
  const code = typeof body.code === "string" ? body.code : undefined;
  return new ApiError(status, detail ?? "Algo deu errado. Tente de novo.", code, fields, body);
}
