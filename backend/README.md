# Back-end (Django)

API REST do sawa: Django 5.2 (LTS), Django REST Framework e SimpleJWT, com PostgreSQL e Redis do Dev Container.

## Rodando

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

cp ../.env.example ../.env        # uma vez; o Django lê o .env da raiz
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

- Admin: http://localhost:8000/admin/ (crie um usuário com `manage.py createsuperuser`).
- Em desenvolvimento (`WHATSAPP_BACKEND=console`), **a mensagem de WhatsApp aparece no terminal do `runserver`**, com o código de 6 dígitos.
- Para o front usar a API, coloque `NEXT_PUBLIC_API_URL=http://localhost:8000` em `frontend/.env.local`.

## Logs

Todo log sai no formato `[NÍVEL ~ DD-MM-AAAA | HH:MM:SS] local.da.funcao - mensagem`, com os níveis TRACE, DEBUG, INFO, WARNING e ERROR:

```
[INFO ~ 11-10-2026 | 14:22:01] accounts.views.SignupView.post - Cadastro recebido para ana@exemplo.com, WhatsApp +55 11 •••••-8888
```

- Nos módulos, use `logger = get_logger(__name__)` (de `config/tracing.py`); `logger.trace(...)` é o passo a passo.
- O `RequestTraceMiddleware` registra cada requisição e, com `TRACE_TO_CLIENT=True`, devolve os logs dela no cabeçalho `X-Trace`. O front-end imprime esses logs no console do navegador, agrupados sob a requisição e com o local prefixado por `back:`. O front manda um `X-Request-ID` para cada requisição, que aparece nos dois lados.
- **Nunca** registre senhas, tokens ou o código de confirmação: com `TRACE_TO_CLIENT`, o log chega ao navegador.
- Variáveis: `LOG_LEVEL` e `TRACE_TO_CLIENT` no `.env`; `NEXT_PUBLIC_LOG_LEVEL` no `frontend/.env.local`.

## Testes e lint

```bash
.venv/bin/python manage.py test
.venv/bin/ruff check . && .venv/bin/ruff format --check .
```

## Autenticação (`/api/auth/`)

Login por e-mail e senha. O cadastro só termina depois de confirmar o **WhatsApp** com um código de 6 dígitos, enviado na mensagem `[SAWA] Seu código chegou: XXXXXX`.

| Método e rota | Corpo | Resposta de sucesso |
|---|---|---|
| `POST cadastro/` | `name`, `email`, `phone`, `password` | `201` `{ email, phone, resend_available_in }` e envia o código (`phone` vem mascarado: `+55 11 •••••-8888`) |
| `POST verificar-codigo/` | `email`, `code` | `200` `{ access, refresh, user }` (já entra logado) |
| `POST reenviar-codigo/` | `email` | `200` sempre (não revela se o e-mail existe) |
| `POST login/` | `email`, `password` | `200` `{ access, refresh, user }` |
| `POST token/renovar/` | `refresh` | `200` `{ access, refresh }` (o refresh antigo deixa de valer) |
| `POST sair/` | `refresh` | `200` e invalida o refresh |
| `GET eu/` | — (cabeçalho `Authorization: Bearer <access>`) | `200` `{ id, name, email, phone, date_joined }` |
| `DELETE eu/` | — (cabeçalho `Authorization`) | `204` e exclui a conta |

**Erros que o front-end trata** vêm como `{ "code": "...", "detail": "mensagem" }`:

| `code` | Quando |
|---|---|
| `email_taken` | Cadastro com e-mail de uma conta já confirmada |
| `phone_taken` | WhatsApp já usado por outra conta confirmada |
| `invalid` | Código errado (ou e-mail sem cadastro) |
| `expired` | Código com mais de 10 minutos |
| `too_many_attempts` | 5 tentativas erradas; é preciso pedir outro código |
| `already_verified` | Cadastro já confirmado; basta fazer login |
| `phone_not_verified` | Login com senha certa, mas WhatsApp não confirmado (`403`, com o `phone` mascarado); um código novo é enviado se já tiver passado 1 minuto |

Erros de validação dos campos seguem o padrão do DRF (`{ "password": ["..."] }`), e o excesso de requisições responde `429`.

**Regras:** código válido por 10 minutos, no máximo 5 tentativas, reenvio a cada 60 segundos. Só o hash do código fica no banco. Access token dura 15 minutos e refresh, 7 dias.

**WhatsApp:** aceita `(11) 99999-8888`, `11999998888` ou `+55 11 99999-8888`, e guarda só os dígitos com DDI (`5511999998888`). Um número preso a um cadastro **não confirmado** é liberado se outra pessoa se cadastrar com ele, para ninguém "reservar" o WhatsApp de terceiros.

## WhatsApp de verdade (Evolution API)

O envio usa a [Evolution API](https://doc.evolution-api.com) v2: `POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}`, com o cabeçalho `apikey` e o corpo `{ "number", "text" }`.

1. Tenha um servidor da Evolution API rodando e uma **instância conectada** (QR code lido pelo WhatsApp do número que vai enviar os códigos).
2. No `.env`, preencha `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE` e `EVOLUTION_API_KEY` e troque `WHATSAPP_BACKEND` para `evolution`.
3. Reinicie o `runserver`. Se a Evolution API falhar, o envio tenta de novo até 3 vezes e o motivo aparece no terminal.

Com `CELERY_TASK_ALWAYS_EAGER=False`, o envio vai para a fila e precisa de um worker:

```bash
.venv/bin/celery -A config worker -l info
```
