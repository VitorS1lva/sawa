# 0004. Modelos de séries temporais para previsão e SLM para linguagem

- **Status:** Aceita
- **Data:** 2026-10-04

## Contexto

O objetivo é prever preços de ações e explicar as previsões. LLMs e SLMs são modelos de linguagem: não foram projetados para extrapolar séries numéricas e tendem a produzir números plausíveis, porém sem fundamento estatístico. Há também a restrição de usar apenas modelos open source e gratuitos.

## Decisão

Separar o problema em duas partes:

1. **Previsão numérica:** modelos de fundação para séries temporais, como **Chronos-Bolt** (Amazon) e **TimesFM** (Google), ambos com licença Apache 2.0. Eles serão comparados com baselines (**Prophet** e **LightGBM**) usando métricas como MAE e MAPE.
2. **Linguagem:** **FinBERT** (e um modelo baseado em BERTimbau para português) para sentimento de notícias, e um **SLM** (família Qwen ou Gemma) servido localmente via **Ollama** para gerar explicações em português.

O SLM recebe a previsão e o sentimento como contexto e **nunca gera os números da previsão**.

## Alternativas consideradas

- **Usar apenas um LLM para prever:** resultado pouco confiável e difícil de avaliar.
- **Apenas modelos clássicos (ARIMA, Prophet):** viável como baseline, mas menos interessante tecnicamente e geralmente inferior aos modelos de fundação.
- **APIs pagas de LLM:** violam a restrição de custo zero e criam dependência externa.

## Consequências

- Cada modelo é usado no que faz melhor, e as previsões podem ser avaliadas com métricas objetivas.
- O SLM local exige vários GB de RAM, o que limita as opções de hospedagem gratuita.
- Previsões de preço de ações têm incerteza inerente; o sistema exibe intervalos de confiança e um aviso de que não constitui recomendação de investimento.
