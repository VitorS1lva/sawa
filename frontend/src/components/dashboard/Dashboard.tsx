"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat-panel/ChatPanel";
import { CheckList } from "@/components/check-list/CheckList";
import { ProjectionChart, type ChartSeries } from "@/components/projection-chart/ProjectionChart";
import { projectionChartConfig, seriesColors } from "@/components/projection-chart/ProjectionChart.config";
import { useExchanges, useProjections, useStocks } from "@/lib/api/queries";
import { dashboardConfig as config, type DashboardTab } from "./dashboard.config";
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
 * Área do usuário em três colunas:
 * chat com a IA (esquerda), bolsas e ações (meio) e gráfico de projeção (direita).
 */
export function Dashboard() {
  const [tab, setTab] = useState<DashboardTab>(config.defaultTab);
  const [chosenExchange, setChosenExchange] = useState<string | null>(null);
  const [tickers, setTickers] = useState<string[]>([]);
  const [colorSlots, setColorSlots] = useState<Record<string, number>>({});

  const exchanges = useExchanges();
  // Enquanto o usuário não escolhe, usa a primeira bolsa da lista.
  const exchangeId = chosenExchange ?? exchanges.data?.[0]?.id ?? null;
  const stocks = useStocks(exchangeId);
  const projections = useProjections(tickers);

  const colors = Object.fromEntries(tickers.map((t) => [t, seriesColors[colorSlots[t]]]));

  function handleTickersChange(next: string[]) {
    setTickers(next);
    setColorSlots((previous) => assignColors(next, previous));
  }

  const chartSeries: ChartSeries[] = tickers.map((ticker, index) => ({
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
            {item.label}
            {item.id === "chart" && tickers.length > 0 && <span className={styles.badge}>{tickers.length}</span>}
          </button>
        ))}
      </div>

      <div id="section-chat" className={styles.chat} data-active={tab === "chat"}>
        <ChatPanel tickers={tickers} />
      </div>

      <div id="section-assets" className={styles.assets} data-active={tab === "assets"}>
        <CheckList
          title={config.exchanges.title}
          items={(exchanges.data ?? []).map((e) => ({ id: e.id, label: e.id, description: e.name }))}
          selected={exchangeId ? [exchangeId] : []}
          onChange={([id]) => setChosenExchange(id)}
          className={styles.exchangeList}
          searchPlaceholder={config.exchanges.searchPlaceholder}
          isLoading={exchanges.isLoading}
          error={exchanges.isError ? config.exchanges.errorText : null}
          emptyText={config.exchanges.emptyText}
        />
        <CheckList
          title={config.stocks.title}
          items={(stocks.data ?? []).map((s) => ({ id: s.ticker, label: s.ticker, description: s.name }))}
          selected={tickers}
          onChange={handleTickersChange}
          className={styles.stockList}
          multiple
          max={projectionChartConfig.maxSeries}
          colors={colors}
          searchPlaceholder={config.stocks.searchPlaceholder}
          isLoading={stocks.isLoading}
          error={stocks.isError ? config.stocks.errorText : null}
          emptyText={exchangeId ? config.stocks.emptyText : config.stocks.selectExchangeText}
        />
      </div>

      <div id="section-chart" className={styles.chart} data-active={tab === "chart"}>
        <ProjectionChart series={chartSeries} />
      </div>
    </div>
  );
}
