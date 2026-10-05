# Ambiente de desenvolvimento

Todo o desenvolvimento acontece dentro de um **Dev Container**. Na máquina local, são necessários apenas Docker, VS Code e Git. Python, Node, PostgreSQL e Redis rodam em containers.

## Serviços do ambiente

| Serviço | Imagem | Função |
|---|---|---|
| `workspace` | `mcr.microsoft.com/devcontainers/python:1-3.12-bookworm` + Node LTS | Onde o código é editado e executado |
| `db` | `timescale/timescaledb:latest-pg16` | PostgreSQL 16 com TimescaleDB |
| `redis` | `redis:7-alpine` | Cache e broker do Celery |

Os dados do PostgreSQL ficam no volume `pgdata` e sobrevivem à recriação do container.

## Instalação

### Windows

1. **Virtualização:** confirme em *Gerenciador de Tarefas > Desempenho > CPU* que "Virtualização" está habilitada. Se não estiver, ative na BIOS (Intel VT-x ou AMD-V/SVM).
2. **WSL2 e Ubuntu**, no PowerShell como administrador:
   ```powershell
   wsl --install -d Ubuntu
   wsl --set-default Ubuntu
   ```
3. **Docker Desktop:** instale com a opção *Use WSL 2 based engine*. Em *Settings > Resources > WSL Integration*, ative o **Ubuntu**.
4. **VS Code** com as extensões **WSL** e **Dev Containers**.
5. **Permissão do Docker**, no terminal do Ubuntu:
   ```bash
   sudo usermod -aG docker $USER
   ```
   Depois, rode `wsl --shutdown` no PowerShell e reabra o Ubuntu.
6. **Git**, no Ubuntu:
   ```bash
   sudo apt update && sudo apt install -y git
   git config --global user.name "Seu Nome"
   git config --global user.email "seu-email@exemplo.com"
   ```

> **Importante:** mantenha o projeto dentro do sistema de arquivos do Linux (ex.: `~/projetos/previsor-acoes`), nunca em `C:\` ou `/mnt/c/...`. O acesso ao disco do Windows a partir do container é muito mais lento.

### macOS e Linux

Instale Docker (Desktop ou Engine), VS Code com a extensão **Dev Containers** e Git. No Linux, adicione seu usuário ao grupo `docker`.

## Primeira execução

```bash
cd ~/projetos/previsor-acoes
cp .env.example .env
code .
```

No VS Code: `Ctrl+Shift+P` → **Dev Containers: Reopen in Container**.

### Verificação

No terminal do VS Code (dentro do container):

```bash
python --version                              # Python 3.12.x
node -v                                       # v2x.x.x
psql "$DATABASE_URL" -c "SELECT version();"   # PostgreSQL 16.x
```

## Uso diário

| Ação | Como fazer |
|---|---|
| Abrir o ambiente | Abra o Ubuntu, `cd ~/projetos/previsor-acoes && code .`, e o VS Code oferece reabrir no container |
| Reconstruir após alterar `.devcontainer/` | `Ctrl+Shift+P` → **Dev Containers: Rebuild Container** |
| Acessar o banco | `psql "$DATABASE_URL"` |
| Liberar espaço do Docker | `docker system prune` (sem `--volumes`, para preservar o banco) |

## Solução de problemas

### `sudo: not found` ao entrar no WSL

O terminal abriu a distribuição interna do Docker (`docker-desktop`), não o Ubuntu. O prompt costuma mostrar `/mnt/host/c/...#` ou `docker-desktop:~#`.

```powershell
exit
wsl -l -v                   # confira o nome exato do Ubuntu
wsl --set-default Ubuntu
wsl -d Ubuntu ~
```

### `WSL_E_DISTRO_NOT_FOUND`

O Ubuntu não está instalado. Rode `wsl --install -d Ubuntu`.

### `Make sure Docker daemon is running`

1. Abra o Docker Desktop e aguarde o status **Engine running**.
2. Confira a integração em *Settings > Resources > WSL Integration*.
3. Teste `docker ps` no terminal do Ubuntu.
4. Se persistir no VS Code, ative a configuração **Dev > Containers: Execute In WSL**.

### `permission denied ... /var/run/docker.sock`

O usuário não pertence ao grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Em seguida, `wsl --shutdown` no PowerShell e reabra o Ubuntu. Confira com `groups`.

### `NO_PUBKEY 62D54FD4003F6525` no `apt-get update`

A imagem base inclui o repositório do Yarn com chave expirada. O projeto usa npm, então o repositório pode ser removido:

```bash
sudo rm -f /etc/apt/sources.list.d/yarn*
```

O `postCreateCommand` do `devcontainer.json` já faz isso automaticamente.

### `psql: command not found`

O `postCreateCommand` ainda não terminou ou falhou. Instale manualmente:

```bash
sudo apt-get update && sudo apt-get install -y postgresql-client
```

### Pouco espaço no disco C:

O Docker e o Ubuntu podem ser movidos para outro disco (formatado em NTFS):

- **Docker:** *Settings > Resources > Advanced > Disk image location*.
- **Ubuntu:**
  ```powershell
  wsl --shutdown
  wsl --manage Ubuntu --move E:\WSL\Ubuntu
  ```

O disco precisa estar conectado sempre que o ambiente for usado.
