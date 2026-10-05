# Registros de Decisões de Arquitetura (ADRs)

Cada ADR documenta uma decisão técnica relevante: o contexto, as alternativas consideradas e as consequências. O objetivo é que qualquer pessoa entenda **por que** o projeto é como é.

Formato baseado no modelo de [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

| Nº | Decisão | Status |
|---|---|---|
| [0001](0001-registrar-decisoes-de-arquitetura.md) | Registrar decisões de arquitetura | Aceita |
| [0002](0002-django-e-react.md) | Django REST Framework no back-end e React no front-end | Aceita (front-end substituído pelo 0007) |
| [0003](0003-postgresql-e-timescaledb.md) | PostgreSQL com TimescaleDB como banco de dados | Aceita |
| [0004](0004-modelos-de-ia.md) | Modelos de séries temporais para previsão e SLM para linguagem | Aceita |
| [0005](0005-processamento-assincrono.md) | Processamento assíncrono com Celery e resultados pré-calculados | Aceita |
| [0006](0006-dev-container.md) | Ambiente de desenvolvimento com Dev Container | Aceita |
| [0007](0007-nextjs-no-front-end.md) | Next.js no front-end | Aceita |

## Como criar um novo ADR

1. Copie o [modelo](template.md) com o próximo número: `0008-titulo-curto.md`.
2. Preencha as seções e abra um pull request.
3. Atualize a tabela acima.

ADRs aceitos não são editados. Se uma decisão mudar, crie um novo ADR e marque o antigo como **Substituída por ADR XXXX**.
