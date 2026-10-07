/*
 * Cores das linhas do gráfico, na ordem em que são atribuídas.
 * Paleta categórica validada para daltonismo sobre a superfície escura (#232327).
 * Não reordene sem validar de novo: a ordem é o que mantém cores vizinhas distinguíveis.
 */
export const seriesColors = [
  "#3987e5", // azul
  "#d95926", // laranja
  "#199e70", // verde-água
  "#c98500", // amarelo
  "#d55181", // magenta
  "#008300", // verde
  "#9085e9", // violeta
  "#e66767", // vermelho
];

export const projectionChartConfig = {
  title: "Projeção",
  /** No máximo uma linha por cor da paleta. */
  maxSeries: seriesColors.length,
  emptyText: "Selecione uma ou mais ações para ver o histórico e a previsão.",
  disclaimer: "Previsões não são recomendação de investimento.",
  legend: { history: "Histórico", forecast: "Previsão", actual: "Realidade" },
  /** Texto antes da porcentagem de acurácia na legenda. */
  accuracyLabel: "Acurácia da ferramenta até agora",
  /** Cores do próprio gráfico (o canvas não lê variáveis CSS). Iguais ao theme.css. */
  theme: {
    text: "#9a9aa2",
    grid: "rgba(207, 207, 212, 0.06)",
    border: "rgba(207, 207, 212, 0.12)",
    crosshair: "rgba(207, 207, 212, 0.35)",
  },
};
