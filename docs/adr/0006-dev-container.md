# 0006. Ambiente de desenvolvimento com Dev Container

- **Status:** Aceita
- **Data:** 2026-10-04

## Contexto

O projeto depende de Python, Node, PostgreSQL com TimescaleDB, Redis e, futuramente, Ollama. Instalar tudo diretamente na máquina causa conflitos de versão, polui o sistema e dificulta que outras pessoas executem o projeto.

## Decisão

Desenvolver dentro de um **Dev Container** configurado em `.devcontainer/`, com os serviços orquestrados por **Docker Compose**. No Windows, o projeto fica no sistema de arquivos do WSL2.

## Alternativas consideradas

- **Instalação local:** conflitos de versão e configuração difícil de reproduzir.
- **GitHub Codespaces:** dispensa instalação local, mas as máquinas gratuitas têm pouca RAM para os modelos de IA.
- **Ambientes virtuais (venv/nvm) sem containers:** isolam linguagens, mas não os serviços de banco e cache.

## Consequências

- Ambiente idêntico para qualquer pessoa, iniciado com um comando.
- A mesma configuração serve de base para a execução do projeto por avaliadores.
- Exige Docker e consome espaço em disco; a primeira construção leva alguns minutos.
