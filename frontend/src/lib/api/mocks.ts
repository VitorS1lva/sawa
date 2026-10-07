/*
 * Dados de exemplo usados enquanto o back-end não existe (veja USE_MOCKS em config.ts).
 * Os preços são inventados, mas sempre iguais para o mesmo ticker.
 */
import type {
  ChatMessage,
  ChatRequest,
  Exchange,
  FavoriteKind,
  Favorites,
  ForecastPoint,
  NewsItem,
  Projection,
  SeriesPoint,
  Stock,
} from "./types";

const HISTORY_DAYS = 180;
const FORECAST_DAYS = 30;
/** A previsão de exemplo foi "feita" há tantos dias úteis; depois disso há dados reais para comparar. */
const DAYS_SINCE_FORECAST = 20;

/** Simula o tempo de resposta da rede. */
function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const exchanges: Exchange[] = [
  { id: "B3", name: "B3 — Brasil, Bolsa, Balcão", country: "Brasil" },
  { id: "NYSE", name: "New York Stock Exchange", country: "Estados Unidos" },
  { id: "NASDAQ", name: "Nasdaq", country: "Estados Unidos" },
  { id: "LSE", name: "London Stock Exchange", country: "Reino Unido" },
  { id: "EURONEXT", name: "Euronext Paris", country: "França" },
  { id: "XETRA", name: "Xetra (Frankfurt)", country: "Alemanha" },
  { id: "TSE", name: "Tokyo Stock Exchange", country: "Japão" },
  { id: "HKEX", name: "Hong Kong Exchanges", country: "Hong Kong" },
];

/** [ticker, nome, preço base] por bolsa. */
const stocksByExchange: Record<string, { currency: string; items: [string, string, number][] }> = {
  B3: {
    currency: "BRL",
    items: [
      ["PETR4", "Petrobras PN", 38],
      ["VALE3", "Vale ON", 62],
      ["ITUB4", "Itaú Unibanco PN", 34],
      ["BBDC4", "Bradesco PN", 14],
      ["BBAS3", "Banco do Brasil ON", 27],
      ["WEGE3", "WEG ON", 41],
      ["ABEV3", "Ambev ON", 13],
      ["B3SA3", "B3 ON", 12],
      ["RENT3", "Localiza ON", 45],
      ["MGLU3", "Magazine Luiza ON", 9],
      ["SUZB3", "Suzano ON", 55],
      ["PRIO3", "PRIO ON", 43],
    ],
  },
  NYSE: {
    currency: "USD",
    items: [
      ["JPM", "JPMorgan Chase", 240],
      ["KO", "Coca-Cola", 70],
      ["DIS", "Walt Disney", 112],
      ["XOM", "Exxon Mobil", 118],
      ["WMT", "Walmart", 96],
      ["V", "Visa", 340],
      ["BA", "Boeing", 210],
    ],
  },
  NASDAQ: {
    currency: "USD",
    items: [
      ["AAPL", "Apple", 230],
      ["MSFT", "Microsoft", 450],
      ["NVDA", "NVIDIA", 180],
      ["AMZN", "Amazon", 220],
      ["GOOGL", "Alphabet A", 190],
      ["META", "Meta Platforms", 700],
      ["TSLA", "Tesla", 330],
    ],
  },
  LSE: {
    currency: "GBP",
    items: [
      ["SHEL", "Shell", 27],
      ["HSBA", "HSBC", 9],
      ["AZN", "AstraZeneca", 115],
    ],
  },
  EURONEXT: {
    currency: "EUR",
    items: [
      ["MC", "LVMH", 620],
      ["OR", "L'Oréal", 380],
      ["TTE", "TotalEnergies", 56],
    ],
  },
  XETRA: {
    currency: "EUR",
    items: [
      ["SAP", "SAP", 240],
      ["SIE", "Siemens", 210],
    ],
  },
  TSE: {
    currency: "JPY",
    items: [
      ["7203", "Toyota", 2800],
      ["6758", "Sony", 3400],
    ],
  },
  HKEX: {
    currency: "HKD",
    items: [
      ["0700", "Tencent", 480],
      ["9988", "Alibaba", 120],
    ],
  },
};

function findStock(ticker: string) {
  for (const [exchangeId, { currency, items }] of Object.entries(stocksByExchange)) {
    const item = items.find(([t]) => t === ticker);
    if (item) return { exchangeId, currency, basePrice: item[2] };
  }
  return { exchangeId: "", currency: "BRL", basePrice: 50 };
}

/** Gerador pseudoaleatório com semente, para o mesmo ticker gerar sempre a mesma série. */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Próximos `count` dias úteis a partir de `from` (exclusivo), em "AAAA-MM-DD". */
function businessDays(from: Date, count: number, direction: 1 | -1): string[] {
  const days: string[] = [];
  const date = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  while (days.length < count) {
    date.setUTCDate(date.getUTCDate() + direction);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(date.toISOString().slice(0, 10));
  }
  return direction === 1 ? days : days.reverse();
}

const round = (value: number) => Math.round(value * 100) / 100;

/** 100 − erro percentual médio (MAPE) entre previsão e realidade nas datas em comum. */
function accuracyOf(forecast: SeriesPoint[], actual: SeriesPoint[]): number | undefined {
  const predicted = new Map(forecast.map((point) => [point.time, point.value]));
  const errors = actual
    .filter((point) => predicted.has(point.time))
    .map((point) => Math.abs(predicted.get(point.time)! - point.value) / point.value);
  if (errors.length === 0) return undefined;
  const mape = (errors.reduce((sum, error) => sum + error, 0) / errors.length) * 100;
  return Math.round((100 - mape) * 10) / 10;
}

export function mockExchanges(): Promise<Exchange[]> {
  return delay(exchanges);
}

export function mockStocks(exchangeId: string): Promise<Stock[]> {
  const group = stocksByExchange[exchangeId];
  const stocks: Stock[] = (group?.items ?? []).map(([ticker, name]) => ({
    ticker,
    name,
    exchangeId,
    currency: group.currency,
  }));
  return delay(stocks);
}

export function mockProjection(ticker: string): Promise<Projection> {
  const { currency, basePrice } = findStock(ticker);
  const random = seededRandom(ticker);
  const today = new Date();

  // Passeio aleatório com leve tendência: todos os preços "reais" até hoje.
  const drift = (random() - 0.45) * 0.002;
  let price = basePrice * (0.85 + random() * 0.3);
  // Dias úteis até hoje (inclusive, se hoje for dia útil).
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const days = businessDays(tomorrow, HISTORY_DAYS, -1);
  const real: SeriesPoint[] = days.map((time) => {
    price *= 1 + drift + (random() - 0.5) * 0.035;
    return { time, value: round(price) };
  });

  // A previsão foi feita na data X: antes dela é histórico, depois é realidade.
  const cutoff = real.length - DAYS_SINCE_FORECAST;
  const history = real.slice(0, cutoff);
  const actual = real.slice(cutoff);
  const forecastStart = new Date(`${history.at(-1)!.time}T12:00:00Z`);

  // Previsão continua a tendência, com intervalo de confiança que abre com o tempo.
  const trend = (random() - 0.4) * 0.003;
  let forecastPrice = history.at(-1)!.value;
  const forecastDays = businessDays(forecastStart, DAYS_SINCE_FORECAST + FORECAST_DAYS, 1);
  const forecast: ForecastPoint[] = forecastDays.map((time, index) => {
    forecastPrice *= 1 + trend + (random() - 0.5) * 0.008;
    const spread = forecastPrice * 0.012 * Math.sqrt(index + 1);
    return {
      time,
      value: round(forecastPrice),
      lower: round(forecastPrice - spread),
      upper: round(forecastPrice + spread),
    };
  });

  return delay(
    {
      ticker,
      currency,
      history,
      forecast,
      actual,
      accuracy: accuracyOf(forecast, actual),
      generatedAt: forecastStart.toISOString(),
    },
    200,
  );
}

/* ---------- Selic ---------- */

/** O Copom se reúne cerca de oito vezes por ano. */
const COPOM_INTERVAL_DAYS = 45;
/** Decisões do Copom, da mais antiga à mais recente; as três últimas vieram depois da previsão. */
const selicDecisions = [10.5, 10.5, 10.75, 11.25, 12.25, 13.25, 14.25, 14.75, 15, 15, 15, 15, 15, 14.5, 14, 13.75];
const SELIC_MEETINGS_SINCE_FORECAST = 3;
/** Previsão feita na data X: as três primeiras já podem ser comparadas com as decisões reais. */
const selicForecast = [14.75, 14.25, 14, 13.5, 13, 12.5, 12.25, 12, 11.75, 11.5, 11.25];

function shiftDays(date: Date, days: number) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + days));
  return copy.toISOString().slice(0, 10);
}

export function mockSelicProjection(): Promise<Projection> {
  const today = new Date();
  const count = selicDecisions.length;
  // Uma decisão a cada reunião (a última foi há 45 dias).
  const decisions: SeriesPoint[] = selicDecisions.map((value, index) => ({
    time: shiftDays(today, -(count - index) * COPOM_INTERVAL_DAYS),
    value,
  }));

  // Data X: a reunião em que a previsão foi feita.
  const cutoff = count - SELIC_MEETINGS_SINCE_FORECAST;
  const history = decisions.slice(0, cutoff);
  // Depois de X: decisões reais, e hoje repete a taxa vigente.
  const actual = [...decisions.slice(cutoff), { time: shiftDays(today, 0), value: selicDecisions[count - 1] }];

  const firstForecastOffset = -(SELIC_MEETINGS_SINCE_FORECAST * COPOM_INTERVAL_DAYS);
  const forecast: ForecastPoint[] = selicForecast.map((value, index) => ({
    time: shiftDays(today, firstForecastOffset + index * COPOM_INTERVAL_DAYS),
    value,
  }));

  return delay(
    {
      ticker: "SELIC",
      history,
      forecast,
      actual,
      accuracy: accuracyOf(forecast, actual),
      generatedAt: `${history.at(-1)!.time}T12:00:00Z`,
    },
    200,
  );
}

/* ---------- Notícias (textos inventados, só para preencher o feed) ---------- */

const newsTemplates: Omit<NewsItem, "id" | "publishedAt">[] = [
  {
    title: "Copom sinaliza continuidade do ciclo de cortes na próxima reunião",
    summary: "Comunicado destaca inflação em desaceleração e expectativas mais ancoradas.",
    source: "Fonte de exemplo",
    sentiment: "positive",
  },
  {
    title: "Boletim Focus: mercado revisa projeção da Selic para o fim do ano",
    summary: "Mediana das estimativas recua pela terceira semana seguida.",
    source: "Fonte de exemplo",
    sentiment: "positive",
  },
  {
    title: "IPCA do mês vem acima do esperado com pressão de serviços",
    summary: "Núcleos de inflação seguem resistentes, o que pode limitar o ritmo de cortes.",
    source: "Fonte de exemplo",
    sentiment: "negative",
  },
  {
    title: "Ata do Copom reforça cautela diante do cenário externo",
    summary: "Diretoria menciona incerteza sobre juros nos Estados Unidos e câmbio.",
    source: "Fonte de exemplo",
    sentiment: "neutral",
  },
  {
    title: "Juros futuros recuam após dados de atividade mais fracos",
    summary: "Curva precifica nova redução de 0,50 ponto na próxima decisão.",
    source: "Fonte de exemplo",
    sentiment: "positive",
  },
  {
    title: "Real se desvaloriza e reacende debate sobre ritmo da política monetária",
    source: "Fonte de exemplo",
    sentiment: "negative",
  },
  {
    title: "Economistas divergem sobre a taxa neutra de juros no Brasil",
    summary: "Estimativas variam entre 4,5% e 5,5% em termos reais.",
    source: "Fonte de exemplo",
    sentiment: "neutral",
  },
];

export function mockNews(topic: string): Promise<NewsItem[]> {
  const now = Date.now();
  const items = newsTemplates.map((template, index) => ({
    ...template,
    id: `${topic}-${index}`,
    // Uma notícia a cada ~5 horas, da mais recente para a mais antiga.
    publishedAt: new Date(now - (index * 5 + 1) * 3_600_000).toISOString(),
  }));
  return delay(items, 250);
}

/* ---------- Favoritos (guardados no navegador para sobreviver ao recarregar) ---------- */

const FAVORITES_KEY = "sawa:mock-favorites";
let memoryFavorites: Favorites = { exchanges: [], stocks: [] };

function readFavorites(): Favorites {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) memoryFavorites = JSON.parse(saved);
  } catch {
    // Sem acesso ao localStorage (ex.: janela anônima): fica só na memória.
  }
  return memoryFavorites;
}

function writeFavorites(favorites: Favorites) {
  memoryFavorites = favorites;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Idem: segue só na memória.
  }
}

export function mockFavorites(): Promise<Favorites> {
  return delay(readFavorites());
}

export function mockSetFavorite(kind: FavoriteKind, id: string, favorite: boolean): Promise<void> {
  const current = readFavorites();
  const ids = current[kind].filter((value) => value !== id);
  writeFavorites({ ...current, [kind]: favorite ? [...ids, id] : ids });
  return delay(undefined);
}

export function mockDeleteAccount(): Promise<void> {
  return delay(undefined, 600);
}

export function mockChatReply({ messages, tickers }: ChatRequest): Promise<ChatMessage> {
  const question = messages.at(-1)?.content ?? "";
  const context = tickers.length
    ? `Você está acompanhando ${tickers.join(", ")}. `
    : "Selecione algumas ações na lista para eu considerar no contexto. ";

  const content =
    `${context}Ainda estou em modo de demonstração, então não consigo analisar "${question.slice(0, 80)}" de verdade. ` +
    "Quando o agente de IA estiver conectado, as respostas virão daqui.";

  return delay({ id: crypto.randomUUID(), role: "assistant", content }, 600);
}
