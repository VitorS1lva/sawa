export type DashboardTab = "chat" | "assets" | "chart";

/** O que a área do usuário mostra: ações das bolsas ou a taxa Selic. */
export type DashboardScope = "stocks" | "selic";

export const dashboardConfig = {
  scope: {
    label: "O que acompanhar",
    options: [
      { id: "stocks", label: "Bolsas de valores" },
      { id: "selic", label: "Taxa Selic" },
    ] satisfies { id: DashboardScope; label: string }[],
    default: "stocks" as DashboardScope,
  },
  selic: {
    /** Tema das notícias pedido à API. */
    newsTopic: "selic",
  },
  exchanges: {
    title: "Bolsas",
    searchPlaceholder: "Buscar bolsa...",
    emptyText: "Nenhuma bolsa disponível.",
    errorText: "Não foi possível carregar as bolsas.",
  },
  stocks: {
    title: "Ações",
    searchPlaceholder: "Buscar por ticker ou nome...",
    emptyText: "Nenhuma ação nesta bolsa.",
    errorText: "Não foi possível carregar as ações.",
    selectExchangeText: "Escolha uma bolsa acima.",
  },
  /** Abas do celular e do tablet em pé (no desktop, as três colunas aparecem lado a lado). */
  tabs: [
    { id: "chat", label: "Assistente" },
    { id: "assets", label: "Ativos" },
    { id: "chart", label: "Gráfico" },
  ] satisfies { id: DashboardTab; label: string }[],
  /** Na Selic, a aba do meio mostra notícias em vez de ativos. */
  selicAssetsTabLabel: "Notícias",
  defaultTab: "assets" as DashboardTab,
};
