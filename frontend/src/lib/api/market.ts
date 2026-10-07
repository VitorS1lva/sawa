import { api } from "./client";
import { endpoints, USE_MOCKS } from "./config";
import type { Exchange, NewsItem, Projection, Stock } from "./types";

/*
 * Os mocks são importados sob demanda: com a API ligada, eles nem entram no bundle carregado.
 */

export async function getExchanges(): Promise<Exchange[]> {
  if (USE_MOCKS) return (await import("./mocks")).mockExchanges();
  const { data } = await api.get<Exchange[]>(endpoints.exchanges);
  return data;
}

export async function getStocks(exchangeId: string): Promise<Stock[]> {
  if (USE_MOCKS) return (await import("./mocks")).mockStocks(exchangeId);
  const { data } = await api.get<Stock[]>(endpoints.stocks, { params: { bolsa: exchangeId } });
  return data;
}

export async function getProjection(ticker: string): Promise<Projection> {
  if (USE_MOCKS) return (await import("./mocks")).mockProjection(ticker);
  const { data } = await api.get<Projection>(endpoints.projection(ticker));
  return data;
}

export async function getSelicProjection(): Promise<Projection> {
  if (USE_MOCKS) return (await import("./mocks")).mockSelicProjection();
  const { data } = await api.get<Projection>(endpoints.selicProjection);
  return data;
}

/** Notícias de um tema (ex.: "selic"), da mais recente para a mais antiga. */
export async function getNews(topic: string): Promise<NewsItem[]> {
  if (USE_MOCKS) return (await import("./mocks")).mockNews(topic);
  const { data } = await api.get<NewsItem[]>(endpoints.news, { params: { tema: topic } });
  return data;
}
