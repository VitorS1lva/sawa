"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  LineStyle,
  LineType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import { Card } from "@/components/card/Card";
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

/** As três linhas de cada série, todas na cor dela. */
type LineSet = { history: ISeriesApi<"Line">; forecast: ISeriesApi<"Line">; actual: ISeriesApi<"Line"> };

/** Converte preços em variação % desde o primeiro ponto, para comparar ações de preços diferentes. */
function toIndexed(points: SeriesPoint[], base: number): SeriesPoint[] {
  return points.map(({ time, value }) => ({ time, value: (value / base - 1) * 100 }));
}

const percent = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const rate = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const accuracyFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function currencyFormatter(currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency });
}

type ProjectionChartProps = {
  series: ChartSeries[];
  /**
   * "price": preços de ações (com várias, vira variação % para comparar).
   * "rate": taxa em % ao ano (ex.: Selic), em degraus, pois só muda nas reuniões do Copom.
   */
  kind?: "price" | "rate";
};

/**
 * Gráfico de linhas. Cada série tem três linhas na mesma cor:
 * histórico até a data da previsão (contínua), previsão do modelo (tracejada)
 * e realidade depois da previsão (contínua com pontos).
 * Com uma ação, o eixo mostra o preço; com várias, a variação % desde o início do período.
 */
export function ProjectionChart({ series, kind = "price" }: ProjectionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const linesRef = useRef(new Map<string, LineSet>());
  const [hover, setHover] = useState<Record<string, number> | null>(null);

  const loaded = series.filter((s): s is ChartSeries & { projection: Projection } => !!s.projection);
  const isRate = kind === "rate";
  const indexed = !isRate && loaded.length > 1;
  let format: (value: number) => string;
  if (isRate) format = (value) => `${rate.format(value)}%`;
  else if (indexed) format = (value) => `${percent.format(value)}%`;
  else format = (value) => currencyFormatter(loaded[0]?.projection.currency ?? "BRL").format(value);
  const lineType = isRate ? LineType.WithSteps : LineType.Simple;
  const scaleLabel = isRate ? "Taxa (% ao ano)" : indexed ? "Variação % no período" : "Preço";

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
      for (const [ticker, { history, forecast, actual }] of lines) {
        // Prefere o valor real; a previsão só aparece onde ainda não há realidade (o futuro).
        const point = (param.seriesData.get(history) ??
          param.seriesData.get(actual) ??
          param.seriesData.get(forecast)) as LineData | undefined;
        if (point?.value !== undefined) values[ticker] = point.value;
      }
      setHover(values);
    }
    chart.subscribeCrosshairMove(handleCrosshairMove);

    // No celular o gráfico nasce numa aba escondida (largura 0); ao aparecer, reajusta o zoom.
    let lastWidth = containerRef.current.clientWidth;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (lastWidth === 0 && width > 0) chart.timeScale().fitContent();
      lastWidth = width;
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      lines.clear();
    };
  }, []);

  // Recria as linhas quando as ações ou os dados mudam.
  const dataKey = kind + loaded.map((s) => `${s.ticker}:${s.color}:${s.projection.generatedAt}`).join("|");
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const lines = linesRef.current;

    for (const set of lines.values()) {
      for (const line of Object.values(set)) chart.removeSeries(line);
    }
    lines.clear();

    chart.applyOptions({ localization: { locale: "pt-BR", priceFormatter: format } });

    for (const { ticker, color, projection } of loaded) {
      const base = projection.history[0]?.value ?? 1;
      const last = projection.history.at(-1);
      // Previsão e realidade partem do último ponto do histórico, para as linhas se encontrarem.
      const forecastPoints = last ? [last, ...projection.forecast] : projection.forecast;
      const actualPoints = last && projection.actual.length ? [last, ...projection.actual] : projection.actual;

      const history = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineType,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerRadius: 4,
      });
      const forecast = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lineType,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerRadius: 4,
      });

      // Realidade: contínua como o histórico, mas com um ponto em cada valor para se diferenciar.
      const actual = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineType,
        pointMarkersVisible: true,
        pointMarkersRadius: 2.5,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerRadius: 4,
      });

      history.setData(indexed ? toIndexed(projection.history, base) : projection.history);
      forecast.setData(indexed ? toIndexed(forecastPoints, base) : forecastPoints);
      actual.setData(indexed ? toIndexed(actualPoints, base) : actualPoints);
      lines.set(ticker, { history, forecast, actual });
    }

    chart.timeScale().fitContent();
    // `dataKey` resume `loaded`, `kind`, `indexed` e `format`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  return (
    <Card
      title={config.title}
      aside={<span className={styles.scale}>{scaleLabel}</span>}
    >

      {series.length > 0 && (
        <ul className={styles.legend}>
          {series.map(({ ticker, color, projection, isLoading, isError }) => {
            // Último valor real conhecido (hoje): realidade, ou o histórico se ainda não houver.
            const lastClose = (projection?.actual.at(-1) ?? projection?.history.at(-1))?.value;
            const lastForecast = projection?.forecast.at(-1)?.value;
            const base = projection?.history[0]?.value ?? 1;
            const current = hover?.[ticker] ?? (lastClose !== undefined && indexed ? (lastClose / base - 1) * 100 : lastClose);
            // Em taxas, a mudança é em pontos percentuais; em preços, em %.
            let change: string | undefined;
            if (lastClose !== undefined && lastForecast !== undefined) {
              const diff = isRate ? lastForecast - lastClose : (lastForecast / lastClose - 1) * 100;
              const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "■";
              change = `${arrow} ${isRate ? `${percent.format(diff)} p.p.` : `${percent.format(diff)}%`} na previsão`;
            }

            return (
              <li key={ticker} className={styles.legendItem}>
                <span className={styles.legendLine} style={{ backgroundColor: color }} aria-hidden="true" />
                <span className={styles.ticker}>{ticker}</span>
                {isLoading && <span className={styles.muted}>Carregando...</span>}
                {isError && <span className={styles.muted}>Erro ao carregar</span>}
                {projection && current !== undefined && <span className={styles.value}>{format(current)}</span>}
                {change && <span className={styles.muted}>{change}</span>}
                {projection?.accuracy !== undefined && (
                  <span className={styles.muted}>
                    ({config.accuracyLabel} {accuracyFormat.format(projection.accuracy)}%)
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
        <span className={styles.key}>
          <span className={styles.keyActual} aria-hidden="true" />
          {config.legend.actual}
        </span>
        <span className={styles.disclaimer}>{config.disclaimer}</span>
      </footer>
    </Card>
  );
}
