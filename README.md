# 📦 Delivery Tracker — SSE (Server-Sent Events)

[![CI/CD Pipeline](https://github.com/Grogww/TesteSSESimulandoRastreadorDeEntregas/actions/workflows/cicd.yml/badge.svg)](https://github.com/Grogww/TesteSSESimulandoRastreadorDeEntregas/actions/workflows/cicd.yml)

Sistema de rastreamento de entregas em tempo real utilizando **Server-Sent Events (SSE)** para comunicação unidirecional entre servidor e cliente via EventStream.

Projeto desenvolvido para a disciplina de **Desenvolvimento Web 2**.

---

## Arquitetura

```
delivery-tracker/
├── docker-compose.yml        # Orquestra os dois containers
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js             # Servidor Express + SSE
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── index.html             # Cliente com EventSource API
```

**Backend (Node.js + Express)** — expõe endpoints REST para criar entregas e um endpoint SSE (`text/event-stream`) que transmite atualizações de status em tempo real.

**Frontend (HTML/CSS/JS puro)** — utiliza a API nativa `EventSource` do navegador para se inscrever no stream de uma entrega e renderizar o progresso visualmente.

---

## Como Funciona o SSE

1. O cliente abre uma conexão HTTP persistente via `EventSource` apontando para `/api/deliveries/:id/stream`.
2. O servidor responde com `Content-Type: text/event-stream` e mantém a conexão aberta.
3. A cada mudança de status, o servidor escreve no stream no formato SSE:
   ```
   event: delivery-update
   data: {"status":"em_transito","label":"Em trânsito",...}
   ```
4. O navegador recebe automaticamente via `es.addEventListener("delivery-update", callback)`.
5. Um heartbeat (comentário `: heartbeat`) é enviado a cada 15s para manter a conexão viva.
6. Se a conexão cair, o `EventSource` reconecta automaticamente.

---

## Etapas da Entrega Simulada

| # | Status              | Descrição                                    |
|---|---------------------|----------------------------------------------|
| 1 | Pedido recebido     | Pedido confirmado e em processamento         |
| 2 | Em separação        | Itens sendo separados no centro de distrib.  |
| 3 | Saiu para entrega   | Pacote saiu rumo ao destino                  |
| 4 | Em trânsito         | Entregador a caminho do endereço             |
| 5 | Entregue            | Entrega concluída com sucesso                |

Cada etapa avança automaticamente a cada 4–7 segundos após a criação.

---

## Executando com Docker

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/delivery-tracker-sse.git
cd delivery-tracker-sse

# Subir os containers
docker-compose up --build

# Acessar
# Frontend → http://localhost:8080
# Backend  → http://localhost:3000
```

Para derrubar:
```bash
docker-compose down
```

---

## Executando sem Docker

**Backend:**
```bash
cd backend
npm install
node server.js
# Rodando em http://localhost:3000
```

**Frontend:**
```bash
# Qualquer servidor estático serve. Exemplos:
cd frontend
npx serve -l 8080
# ou: python3 -m http.server 8080
# Abrir http://localhost:8080
```

---

## Endpoints da API

| Método | Rota                            | Descrição                          |
|--------|---------------------------------|------------------------------------|
| POST   | `/api/deliveries`               | Cria uma nova entrega simulada     |
| GET    | `/api/deliveries`               | Lista todas as entregas ativas     |
| GET    | `/api/deliveries/:id/stream`    | **SSE** — stream de atualizações   |
| GET    | `/health`                       | Health check do servidor           |

---

## Tecnologias

- **Backend:** Node.js, Express, CORS, UUID
- **Frontend:** HTML5, CSS3, JavaScript (EventSource API)
- **Infra:** Docker, Docker Compose, Nginx

---

## Conceitos Demonstrados

- **Server-Sent Events (SSE):** comunicação unidirecional server → client via HTTP
- **EventSource API:** interface nativa do navegador para consumir streams SSE
- **Content-Type `text/event-stream`:** formato padrão de resposta SSE
- **Heartbeat:** manutenção de conexão persistente
- **Reconexão automática:** comportamento nativo do EventSource ao perder conexão

---

## CI/CD com GitHub Actions

Pipeline automatizado configurado em `.github/workflows/cicd.yml`, disparado a cada `push` e `pull_request` na branch `main`.

**Job 1 — CI (`build-and-test`):**
- Instala dependências com `npm ci`
- Roda análise de código com ESLint (`npm run lint`)
- Executa testes automatizados com Jest + Supertest (`npm test`)

**Job 2 — CD (`deploy-simulation`):** executa apenas em `push` na `main` e só se o CI passar (`needs: build-and-test`).
- Valida o build das imagens Docker (`docker compose build`)
- Empacota o artefato e simula a publicação em produção

Para testar localmente:
\`\`\`bash
cd backend
npm install
npm run lint
npm test
\`\`\`


