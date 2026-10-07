import type { NewsSentiment } from "@/lib/api/types";

export const newsFeedConfig = {
  title: "Notícias",
  emptyText: "Nenhuma notícia por enquanto.",
  errorText: "Não foi possível carregar as notícias.",
  sentiment: {
    positive: "Positiva",
    neutral: "Neutra",
    negative: "Negativa",
  } satisfies Record<NewsSentiment, string>,
};
