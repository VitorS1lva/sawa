# 0003. PostgreSQL com TimescaleDB como banco de dados

- **Status:** Aceita
- **Data:** 2026-10-04

## Contexto

O sistema armazena dois tipos de dados: relacionais (usuários, carteiras, ativos) e séries temporais (cotações diárias de centenas de ativos ao longo de anos). Consultas típicas envolvem intervalos de datas e agregações por período.

## Decisão

Usar **PostgreSQL 16** com a extensão **TimescaleDB**. As cotações ficam em hypertables; os demais dados, em tabelas comuns. **Redis** é usado para cache e como broker do Celery.

## Alternativas consideradas

- **PostgreSQL puro:** funciona, mas sem compressão nativa nem funções otimizadas para séries temporais.
- **InfluxDB:** especializado em séries temporais, mas exigiria um segundo banco para os dados relacionais.
- **MongoDB:** sem vantagem clara para dados tabulares e relacionais como os deste projeto.

## Consequências

- Um único banco atende aos dois tipos de dado, com integração nativa ao ORM do Django.
- Algumas funções avançadas do TimescaleDB usam a Timescale License, que permite uso livre exceto na oferta do banco como serviço.
- Hypertables exigem migrations com SQL específico, além das geradas pelo Django.
