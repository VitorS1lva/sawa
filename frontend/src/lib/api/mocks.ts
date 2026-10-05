/*
 * Dados de exemplo usados enquanto o back-end não existe (veja USE_MOCKS em config.ts).
 * Os preços são inventados, mas sempre iguais para o mesmo ticker.
 */
import type { ChatMessage, ChatRequest, Exchange, ForecastPoint, Projection, SeriesPoint, Stock } from "./types";

const HISTORY_DAYS = 180;
const FORECAST_DAYS = 30;

/** Simula o tempo de resposta da rede. */
function delay<T>(value: T, ms = 400): Promise<T> {
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

  // Passeio aleatório com leve tendência.
  const drift = (random() - 0.45) * 0.002;
  let price = basePrice * (0.85 + random() * 0.3);
  // Dias úteis até hoje (inclusive, se hoje for dia útil).
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const history: SeriesPoint[] = businessDays(tomorrow, HISTORY_DAYS, -1).map((time) => {
    price *= 1 + drift + (random() - 0.5) * 0.035;
    return { time, value: round(price) };
  });

  // Previsão continua a tendência, com intervalo de confiança que abre com o tempo.
  const trend = (random() - 0.4) * 0.003;
  let forecastPrice = price;
  const forecast: ForecastPoint[] = businessDays(today, FORECAST_DAYS, 1).map((time, index) => {
    forecastPrice *= 1 + trend + (random() - 0.5) * 0.008;
    const spread = forecastPrice * 0.012 * Math.sqrt(index + 1);
    return {
      time,
      value: round(forecastPrice),
      lower: round(forecastPrice - spread),
      upper: round(forecastPrice + spread),
    };
  });

  return delay({ ticker, currency, history, forecast, generatedAt: today.toISOString() }, 500);
}

export function mockChatReply({ messages, tickers }: ChatRequest): Promise<ChatMessage> {
  const question = messages.at(-1)?.content ?? "";
  const context = tickers.length
    ? `Você está acompanhando ${tickers.join(", ")}. `
    : "Selecione algumas ações na lista para eu considerar no contexto. ";

  const content =
    `${context}Ainda estou em modo de demonstração, então não consigo analisar "${question.slice(0, 80)}" de verdade. ` +
    "Quando o agente de IA estiver conectado, as respostas virão daqui.";

  return delay({ id: crypto.randomUUID(), role: "assistant", content }, 900);
}
