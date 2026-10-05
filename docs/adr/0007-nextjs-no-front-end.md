# 0007. Next.js no front-end

- **Status:** Aceita
- **Data:** 2026-10-04
- **Substitui:** a parte de front-end do [ADR 0002](0002-django-e-react.md)

## Contexto

O ADR 0002 escolheu React com Vite para o front-end. Ao iniciar a implementação, o Next.js foi reavaliado: ele é o framework React mais pedido em vagas, traz roteamento por arquivos, otimização de imagens e fontes, e permite páginas públicas (como a listagem de ações) renderizadas no servidor, com melhor tempo de carregamento e SEO.

## Decisão

Usar **Next.js com App Router e TypeScript** no front-end, mantendo TanStack Query, Axios, Tailwind CSS, shadcn/ui e Lightweight Charts.

Regras para manter a arquitetura limpa:

- O **Django continua sendo a única API** do sistema. O Next.js não terá rotas de API com regra de negócio nem acesso direto ao banco.
- Páginas públicas podem buscar dados no servidor (Server Components); telas interativas e autenticadas usam Client Components com TanStack Query.
- Bibliotecas que dependem do navegador, como a Lightweight Charts, ficam apenas em Client Components.

## Alternativas consideradas

- **Manter React + Vite:** mais simples, mas sem renderização no servidor e menos alinhado ao mercado.
- **Remix / React Router v7:** boa proposta, porém com adoção menor em vagas.

## Consequências

- Front-end mais alinhado ao mercado e com melhor desempenho nas páginas públicas.
- Mais conceitos para dominar (Server vs. Client Components, cache do Next.js).
- A porta de desenvolvimento do front-end passa a ser a **3000**.
