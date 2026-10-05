# Guia de contribuição

Obrigado pelo interesse em contribuir! Este guia descreve os padrões do projeto.

## Ambiente

Siga o [guia do ambiente de desenvolvimento](docs/ambiente-de-desenvolvimento.md). Todo o desenvolvimento acontece dentro do Dev Container.

## Fluxo de trabalho

1. Crie uma branch a partir da branch principal (`master`), seguindo o padrão abaixo.
2. Faça commits pequenos e descritivos.
3. Garanta que lint e testes passam.
4. Abra um pull request preenchendo o modelo.

### Nomes de branch

```
<tipo>/<descricao-curta>
```

Exemplos: `feat/grafico-candlestick`, `fix/token-expirado`, `docs/adr-cache`.

## Padrão de commits

O projeto segue o [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação, sem mudança de lógica |
| `refactor` | Mudança de código sem alterar comportamento |
| `test` | Criação ou ajuste de testes |
| `chore` | Configuração, dependências, ferramentas |
| `ci` | Pipelines de integração contínua |
| `perf` | Melhoria de desempenho |

Escopos sugeridos: `frontend`, `backend`, `ml`, `db`, `infra`, `devcontainer`.

Exemplos:

```
feat(frontend): adiciona gráfico de candlestick na página do ativo
fix(backend): corrige expiração do refresh token
docs: adiciona ADR sobre estratégia de cache
```

## Padrões de código

| Área | Ferramentas |
|---|---|
| Python | `ruff` (lint e formatação), type hints, `pytest` |
| TypeScript / React | `eslint`, `prettier`, `vitest` |
| Geral | Configurações do `.editorconfig` |

- Código, nomes de variáveis e funções em **inglês**.
- Documentação, commits e interface em **português**.

## Decisões de arquitetura

Mudanças estruturais (nova tecnologia, novo serviço, mudança de padrão) devem vir acompanhadas de um [ADR](docs/adr/).

## Segurança

Nunca versione segredos, tokens ou senhas. Use o arquivo `.env`, que está no `.gitignore`, e documente novas variáveis no `.env.example`.
