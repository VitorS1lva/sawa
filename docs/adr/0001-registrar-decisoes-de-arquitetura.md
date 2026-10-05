# 0001. Registrar decisões de arquitetura

- **Status:** Aceita
- **Data:** 2026-10-04

## Contexto

O projeto envolve várias escolhas técnicas com trade-offs (banco de dados, modelos de IA, processamento assíncrono). Sem registro, o motivo de cada escolha se perde com o tempo e fica difícil explicá-lo a quem avalia ou contribui com o código.

## Decisão

Registrar cada decisão arquitetural relevante como um ADR em `docs/adr/`, usando o formato de Michael Nygard.

## Consequências

- O raciocínio por trás do projeto fica documentado e versionado junto do código.
- Há um pequeno custo de escrita a cada decisão importante.
