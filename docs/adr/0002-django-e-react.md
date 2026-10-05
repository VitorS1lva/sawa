# 0002. Django REST Framework no back-end e React no front-end

- **Status:** Aceita (front-end substituído pelo ADR 0007)
- **Data:** 2026-10-04

## Contexto

O projeto precisa de autenticação, área do usuário, painel administrativo e uma API que sirva dados de cotações e previsões. O ecossistema de IA e dados é predominantemente Python. O portfólio tem como alvo a stack Python + Django + React.

## Decisão

- **Back-end:** Django com Django REST Framework e autenticação JWT (SimpleJWT).
- **Front-end:** React com TypeScript, Vite, TanStack Query, Axios, Tailwind CSS, shadcn/ui e Lightweight Charts.

## Alternativas consideradas

- **FastAPI:** mais leve e com suporte nativo a async, mas exigiria montar manualmente autenticação, admin, ORM e migrations, que o Django já oferece.
- **Node.js (NestJS/Express) no back-end:** separaria a API do ecossistema Python de IA, exigindo um serviço extra para os modelos.
- **Next.js no front-end:** SSR e SEO não são prioridade para um dashboard autenticado; Vite é mais simples.
- **SWR ou RTK Query:** SWR tem menos recursos; RTK Query só compensa com Redux, que não é necessário aqui.
- **Recharts/Chart.js:** não têm candlestick de qualidade profissional como a Lightweight Charts.

## Consequências

- Back-end e pipeline de IA compartilham a mesma linguagem e os mesmos modelos de dados.
- Django traz convenções fortes, o que acelera o desenvolvimento, mas exige seguir seu padrão.
- A Lightweight Charts exige atribuição à TradingView na interface.
