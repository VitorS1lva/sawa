/*
 * Formatos de dados trocados com a API Django.
 * Quando o back-end existir, estes tipos devem bater com os serializers do DRF.
 */

/** Bolsa de valores que o usuário pode acessar. */
export type Exchange = {
  id: string; // ex.: "B3"
  name: string; // ex.: "B3 — Brasil, Bolsa, Balcão"
  country: string;
};

/** Ação negociada numa bolsa. */
export type Stock = {
  ticker: string; // ex.: "PETR4"
  name: string;
  exchangeId: string;
  currency: string; // código ISO 4217, ex.: "BRL"
};

/** Um ponto da série; `time` no formato "AAAA-MM-DD". */
export type SeriesPoint = { time: string; value: number };

/** Ponto da previsão, com intervalo de confiança opcional. */
export type ForecastPoint = SeriesPoint & { lower?: number; upper?: number };

/** Histórico de fechamentos e previsão de uma ação (GET /api/ativos/{ticker}/previsao/). */
export type Projection = {
  ticker: string;
  currency: string;
  history: SeriesPoint[];
  forecast: ForecastPoint[];
  generatedAt: string; // data/hora ISO em que a previsão foi calculada
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

/** Corpo do POST /api/chat/. `tickers` dá contexto ao modelo sobre o que o usuário está vendo. */
export type ChatRequest = {
  messages: Pick<ChatMessage, "role" | "content">[];
  tickers: string[];
};
