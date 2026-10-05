import { api } from "./client";
import { endpoints, USE_MOCKS } from "./config";
import type { Exchange, Projection, Stock } from "./types";

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
