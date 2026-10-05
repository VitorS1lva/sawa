# 0005. Processamento assíncrono com Celery e resultados pré-calculados

- **Status:** Aceita
- **Data:** 2026-10-04

## Contexto

Coletar cotações, rodar modelos de previsão e gerar textos com um SLM pode levar de segundos a minutos por ativo. Executar isso durante uma requisição HTTP tornaria a aplicação lenta e instável. Os dados de mercado mudam em intervalos conhecidos (fechamento do pregão), então os resultados podem ser calculados com antecedência.

## Decisão

Usar **Celery** com **Redis** como broker e **Celery Beat** como agendador. Todas as tarefas pesadas rodam em workers e gravam os resultados no banco. A API apenas lê dados já processados.

## Alternativas consideradas

- **Processar sob demanda na requisição:** simples, mas com latência alta e risco de timeout.
- **Cron + scripts:** sem retry, monitoramento ou distribuição de carga.
- **Dramatiq, RQ ou Huey:** mais simples, mas com ecossistema e integração com Django menores que os do Celery.

## Consequências

- Respostas rápidas e previsíveis na API.
- Os resultados refletem o último processamento, não o instante exato da consulta (aceitável para previsões diárias).
- Mais componentes para operar (broker, workers, agendador), monitorados pelo Flower.
