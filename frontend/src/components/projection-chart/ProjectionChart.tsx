"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import type { Projection, SeriesPoint } from "@/lib/api/types";
import { projectionChartConfig as config } from "./ProjectionChart.config";
import styles from "./ProjectionChart.module.css";

export type ChartSeries = {
  ticker: string;
  color: string;
  projection?: Projection;
  isLoading: boolean;
  isError: boolean;
};

type LineSet = { history: ISeriesApi<"Line">; forecast: ISeriesApi<"Line"> };

/** Converte preços em variação % desde o primeiro ponto, para comparar ações de preços diferentes. */
function toIndexed(points: SeriesPoint[], base: number): SeriesPoint[] {
  return points.map(({ time, value }) => ({ time, value: (value / base - 1) * 100 }));
}

const percent = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: "exceptZero",
});

function currencyFormatter(currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency });
}

/**
 * Gráfico de linhas: histórico (contínuo) e previsão (tracejado) de cada ação marcada.
 * Com uma ação, o eixo mostra o preço; com várias, a variação % desde o início do período.
 */
export function ProjectionChart({ series }: { series: ChartSeries[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const linesRef = useRef(new Map<string, LineSet>());
  const [hover, setHover] = useState<Record<string, number> | null>(null);
  const titleId = useId();

  const loaded = series.filter((s): s is ChartSeries & { projection: Projection } => !!s.projection);
  const indexed = loaded.length > 1;
  const format = indexed
    ? (value: number) => `${percent.format(value)}%`
    : (value: number) => currencyFormatter(loaded[0]?.projection.currency ?? "BRL").format(value);

  // Cria o gráfico uma única vez.
  useEffect(() => {
    if (!containerRef.current) return;
    const { theme } = config;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: theme.text,
        fontFamily: getComputedStyle(document.body).fontFamily,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: theme.grid } },
      rightPriceScale: { borderColor: theme.border },
      timeScale: { borderColor: theme.border },
      crosshair: {
        vertLine: { color: theme.crosshair, labelBackgroundColor: "#1c1c1f" },
        horzLine: { color: theme.crosshair, labelBackgroundColor: "#1c1c1f" },
      },
      localization: { locale: "pt-BR" },
    });
    chartRef.current = chart;
    const lines = linesRef.current;

    // Valores sob o cursor, mostrados na legenda.
    function handleCrosshairMove(param: MouseEventParams<Time>) {
      if (!param.time) {
        setHover(null);
        return;
      }
      const values: Record<string, number> = {};
      for (const [ticker, { history, forecast }] of lines) {
        const point = (param.seriesData.get(history) ?? param.seriesData.get(forecast)) as LineData | undefined;
        if (point?.value !== undefined) values[ticker] = point.value;
      }
      setHover(values);
    }
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      lines.clear();
    };
  }, []);

  // Recria as linhas quando as ações ou os dados mudam.
  const dataKey = loaded.map((s) => `${s.ticker}:${s.color}:${s.projection.generatedAt}`).join("|");
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const lines = linesRef.current;

    for (const { history, forecast } of lines.values()) {
      chart.removeSeries(history);
      chart.removeSeries(forecast);
    }
    lines.clear();

    chart.applyOptions({ localization: { locale: "pt-BR", priceFormatter: format } });

    for (const { ticker, color, projection } of loaded) {
      const base = projection.history[0]?.value ?? 1;
      const last = projection.history.at(-1);
      // A previsão começa no último fechamento, para as duas linhas se encontrarem.
      const forecastPoints = last ? [last, ...projection.forecast] : projection.forecast;

      const history = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerRadius: 4,
      });
      const forecast = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerRadius: 4,
      });

      history.setData(indexed ? toIndexed(projection.history, base) : projection.history);
      forecast.setData(indexed ? toIndexed(forecastPoints, base) : forecastPoints);
      lines.set(ticker, { history, forecast });
    }

    chart.timeScale().fitContent();
    // `dataKey` resume `loaded`, `indexed` e `format`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {config.title}
        </h2>
        <span className={styles.scale}>{indexed ? "Variação % no período" : "Preço"}</span>
      </header>

      {series.length > 0 && (
        <ul className={styles.legend}>
          {series.map(({ ticker, color, projection, isLoading, isError }) => {
            const lastClose = projection?.history.at(-1)?.value;
            const lastForecast = projection?.forecast.at(-1)?.value;
            const base = projection?.history[0]?.value ?? 1;
            const current = hover?.[ticker] ?? (lastClose !== undefined && indexed ? (lastClose / base - 1) * 100 : lastClose);
            const change =
              lastClose !== undefined && lastForecast !== undefined ? (lastForecast / lastClose - 1) * 100 : undefined;

            return (
              <li key={ticker} className={styles.legendItem}>
                <span className={styles.legendLine} style={{ backgroundColor: color }} aria-hidden="true" />
                <span className={styles.ticker}>{ticker}</span>
                {isLoading && <span className={styles.muted}>Carregando...</span>}
                {isError && <span className={styles.muted}>Erro ao carregar</span>}
                {projection && current !== undefined && <span className={styles.value}>{format(current)}</span>}
                {change !== undefined && (
                  <span className={styles.muted}>
                    {change >= 0 ? "▲" : "▼"} {percent.format(change)}% na previsão
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.canvasWrap}>
        <div ref={containerRef} className={styles.canvas} />
        {series.length === 0 && <p className={styles.empty}>{config.emptyText}</p>}
      </div>

      <footer className={styles.footer}>
        <span className={styles.key}>
          <span className={styles.keySolid} aria-hidden="true" />
          {config.legend.history}
        </span>
        <span className={styles.key}>
          <span className={styles.keyDashed} aria-hidden="true" />
          {config.legend.forecast}
        </span>
        <span className={styles.disclaimer}>{config.disclaimer}</span>
      </footer>
    </section>
  );
}
