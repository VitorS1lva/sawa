/*
 * Textos dos balões informativos do menu da página inicial.
 * Painéis de texto usam `paragraphs`; painéis de lista usam `intro` e `items`.
 */

export const aboutPanel = {
  title: "Sobre",
  paragraphs: [
    "Esta ferramenta combina modelos de séries temporais e inteligência artificial para estimar o comportamento do mercado de investimentos.",
    "A proposta da ferramenta é entregar uma ambiente de conhecimento grátis, facilitado e livre de idelogias. Além, é claro, de habilitar um ambiente propício a todos os usuários, sejam estes experiêntes no assunto ou não.",
    "A principio a proposta é que toda informação será atualizada em D-1, ou seja com um dia de antecedência devido a limitações da infraestrutura atual."
  ],
};

export const disclaimerPanel = {
  title: "Disclaimer",
  paragraphs: [
    "Apesar do modelo utilizar cenários reais de projeção, este é um projeto pessoal sem fins lucrativos.",
    "As previsões não constituem nem devem ser consideradas uma recomendação de investimento.",
  ],
};

export const featuresAtuaisPanel = {
  title: "Features atuais",
  intro: "Funcionalidades da ferramenta:",
  items: [
    "Gráficos de previsões de ações da B3, NYSE e Nasdaq",
    "Gráficos de previsões da Taxa Selic",
    "Previsões de preço com inteligência artificial (plotado em gráfico)",
    "Análise de sentimento das notícias",
    "Carteira pessoal para acompanhar seus ativos favoritados",
  ],
};

export const featuresFuturasPanel = {
  title: "Features futuras",
  intro: "Funcionalidades planejadas:",
  items: [
    "Sistema de chat com Agente de IA especializado em assuntos financeiros",
    "Atualização de notícias em tempo real",
    "Aba de feedback sobre a ferramenta na página incial aberta a público e sistema de avaliação por nota"
  ],
};
