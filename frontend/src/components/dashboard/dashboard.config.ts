export type DashboardTab = "chat" | "assets" | "chart";

export const dashboardConfig = {
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
  defaultTab: "assets" as DashboardTab,
};
