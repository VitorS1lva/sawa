"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel/ChatPanel";
import { CheckList } from "@/components/check-list/CheckList";
import { NewsFeed } from "@/components/news-feed/NewsFeed";
import { ProjectionChart, type ChartSeries } from "@/components/projection-chart/ProjectionChart";
import { projectionChartConfig, seriesColors } from "@/components/projection-chart/ProjectionChart.config";
import { ScopeSwitch } from "@/components/scope-switch/ScopeSwitch";
import {
  useExchanges,
  useFavorites,
  useNews,
  useProjections,
  useSelicProjection,
  useStocks,
  useToggleFavorite,
} from "@/lib/api/queries";
import { dashboardConfig as config, type DashboardScope, type DashboardTab } from "./dashboard.config";
import styles from "./Dashboard.module.css";

/** Dá a cada ação nova a primeira cor livre; as já marcadas mantêm a sua. */
function assignColors(tickers: string[], previous: Record<string, number>) {
  const slots: Record<string, number> = {};
  for (const ticker of tickers) {
    if (ticker in previous) slots[ticker] = previous[ticker];
  }
  for (const ticker of tickers) {
    if (ticker in slots) continue;
    const used = new Set(Object.values(slots));
    slots[ticker] = seriesColors.findIndex((_, index) => !used.has(index));
  }
  return slots;
}

/**
 * Área do usuário em três colunas: chat com a IA (esquerda), escolha do escopo e
 * bolsas/ações ou notícias da Selic (meio) e gráfico de projeção (direita).
 */
export function Dashboard() {
  const [tab, setTab] = useState<DashboardTab>(config.defaultTab);
  const [scope, setScope] = useState<DashboardScope>(config.scope.default);
  const isSelic = scope === "selic";
  const [chosenExchange, setChosenExchange] = useState<string | null>(null);
  const [tickers, setTickers] = useState<string[]>([]);
  const [colorSlots, setColorSlots] = useState<Record<string, number>>({});

  const exchanges = useExchanges();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favoriteExchanges = favorites.data?.exchanges ?? [];
  // Enquanto o usuário não escolhe, abre na primeira bolsa favorita (ou na primeira da lista).
  // Espera os favoritos carregarem, para não abrir numa bolsa e pular para outra.
  const defaultExchange = favorites.isPending ? null : (favoriteExchanges[0] ?? exchanges.data?.[0]?.id ?? null);
  const exchangeId = chosenExchange ?? defaultExchange;
  const stocks = useStocks(exchangeId);
  const projections = useProjections(tickers);
  const selic = useSelicProjection(isSelic);
  const news = useNews(isSelic ? config.selic.newsTopic : null);

  const colors = Object.fromEntries(tickers.map((t) => [t, seriesColors[colorSlots[t]]]));

  function handleTickersChange(next: string[]) {
    setTickers(next);
    setColorSlots((previous) => assignColors(next, previous));
  }

  function handleExchangeFavorite(id: string, favorite: boolean) {
    // Fixa a bolsa aberta: favoritar não deve trocar a lista de ações que o usuário está vendo.
    if (!chosenExchange) setChosenExchange(exchangeId);
    toggleFavorite.mutate({ kind: "exchanges", id, favorite });
  }

  // As ações marcadas continuam guardadas enquanto o usuário olha a Selic.
  const chartSeries: ChartSeries[] = isSelic
    ? [
        {
          ticker: "SELIC",
          color: seriesColors[0],
          projection: selic.data,
          isLoading: selic.isLoading,
          isError: selic.isError,
        },
      ]
    : tickers.map((ticker, index) => ({
        ticker,
        color: colors[ticker],
        projection: projections[index]?.data,
        isLoading: projections[index]?.isLoading ?? true,
        isError: projections[index]?.isError ?? false,
      }));

  return (
    <div className={styles.dashboard}>
      <div className={styles.tabs} role="tablist" aria-label="Seções">
        {config.tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`section-${item.id}`}
            className={styles.tab}
            onClick={() => setTab(item.id)}
          >
            {item.id === "assets" && isSelic ? config.selicAssetsTabLabel : item.label}
            {item.id === "chart" && !isSelic && tickers.length > 0 && (
              <span className={styles.badge}>{tickers.length}</span>
            )}
          </button>
        ))}
      </div>

      <div id="section-chat" className={styles.chat} data-active={tab === "chat"}>
        <ChatPanel tickers={isSelic ? ["SELIC"] : tickers} />
      </div>

      <div id="section-assets" className={styles.assets} data-active={tab === "assets"} data-scope={scope}>
        <ScopeSwitch label={config.scope.label} options={config.scope.options} value={scope} onChange={setScope} />

        {isSelic ? (
          <NewsFeed items={news.data} isLoading={news.isLoading} isError={news.isError} className={styles.newsFeed} />
        ) : (
          <>
            <CheckList
              title={config.exchanges.title}
              items={(exchanges.data ?? []).map((e) => ({ id: e.id, label: e.id, description: e.name }))}
              selected={exchangeId ? [exchangeId] : []}
              onChange={([id]) => setChosenExchange(id)}
              className={styles.exchangeList}
              favorites={favoriteExchanges}
              onToggleFavorite={handleExchangeFavorite}
              searchPlaceholder={config.exchanges.searchPlaceholder}
              isLoading={exchanges.isLoading || favorites.isPending}
              error={exchanges.isError ? config.exchanges.errorText : null}
              emptyText={config.exchanges.emptyText}
            />
            <CheckList
              title={config.stocks.title}
              items={(stocks.data ?? []).map((s) => ({ id: s.ticker, label: s.ticker, description: s.name }))}
              selected={tickers}
              onChange={handleTickersChange}
              className={styles.stockList}
              favorites={favorites.data?.stocks}
              onToggleFavorite={(id, favorite) => toggleFavorite.mutate({ kind: "stocks", id, favorite })}
              multiple
              max={projectionChartConfig.maxSeries}
              colors={colors}
              searchPlaceholder={config.stocks.searchPlaceholder}
              isLoading={stocks.isLoading || (!exchangeId && (exchanges.isPending || favorites.isPending))}
              error={stocks.isError ? config.stocks.errorText : null}
              emptyText={exchangeId ? config.stocks.emptyText : config.stocks.selectExchangeText}
            />
          </>
        )}
      </div>

      <div id="section-chart" className={styles.chart} data-active={tab === "chart"}>
        <ProjectionChart series={chartSeries} kind={isSelic ? "rate" : "price"} />
      </div>
    </div>
  );
}
