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

/**
 * Histórico e previsão de uma série: preço de uma ação (GET /api/ativos/{ticker}/previsao/)
 * ou taxa, como a Selic (GET /api/selic/previsao/).
 */
export type Projection = {
  ticker: string;
  /** Moeda dos preços; ausente em taxas (ex.: Selic, em % ao ano). */
  currency?: string;
  /** Valores reais até a data X, em que a previsão foi feita. */
  history: SeriesPoint[];
  /** Previsão do modelo a partir da data X (cobre o passado recente e o futuro). */
  forecast: ForecastPoint[];
  /** O que de fato aconteceu depois da data X, até hoje. Vazio se a previsão é de hoje. */
  actual: SeriesPoint[];
  /**
   * Acurácia do modelo até agora, de 0 a 100, calculada pelo back-end
   * comparando previsões já vencidas com a realidade (ex.: 100 − MAPE).
   */
  accuracy?: number;
  generatedAt: string; // data/hora ISO em que a previsão foi calculada (a data X)
};

/* ---------- Autenticação ---------- */

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  /** WhatsApp só com dígitos e DDI (ex.: "5511999998888"). */
  phone: string | null;
  date_joined: string;
};

export type AuthTokens = { access: string; refresh: string };

/** Resposta do login e da confirmação de e-mail. */
export type Session = AuthTokens & { user: AuthUser };

export type SignupInput = { name: string; email: string; phone: string; password: string };

/** Cadastro criado, esperando o código enviado pelo WhatsApp. `phone` vem mascarado ("+55 11 •••••-8888"). */
export type PendingSignup = { email: string; phone: string; resend_available_in: number };

export type NewsSentiment = "positive" | "neutral" | "negative";

/** Notícia já coletada e analisada pelo back-end (GET /api/noticias/?tema=selic). */
export type NewsItem = {
  id: string;
  title: string;
  summary?: string;
  source: string;
  /** Link para a matéria original; sem ele, a notícia não vira link. */
  url?: string;
  publishedAt: string; // data/hora ISO
  /** Sentimento calculado pelo modelo de análise de notícias. */
  sentiment?: NewsSentiment;
};

/** Tipo de item que pode ser favoritado. */
export type FavoriteKind = "exchanges" | "stocks";

/** Favoritos do usuário: ids das bolsas e tickers das ações (GET /api/favoritos/). */
export type Favorites = Record<FavoriteKind, string[]>;

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
