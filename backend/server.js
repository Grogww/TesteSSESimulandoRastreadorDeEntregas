const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ── Dados em memória ──────────────────────────────────────────────────
const deliveries = new Map();
const clients = new Map(); // deliveryId -> Set<res>

// Etapas de uma entrega
const STAGES = [
  {
    status: "pedido_recebido",
    label: "Pedido recebido",
    detail: "Seu pedido foi confirmado e está sendo processado.",
  },
  {
    status: "em_separacao",
    label: "Em separação",
    detail: "Os itens estão sendo separados no centro de distribuição.",
  },
  {
    status: "saiu_para_entrega",
    label: "Saiu para entrega",
    detail: "O pacote saiu do centro de distribuição rumo ao destino.",
  },
  {
    status: "em_transito",
    label: "Em trânsito",
    detail: "O entregador está a caminho do endereço de entrega.",
  },
  {
    status: "entregue",
    label: "Entregue",
    detail: "O pacote foi entregue com sucesso! Obrigado pela preferência.",
  },
];

// Localizações simuladas para cada etapa
const LOCATIONS_POOL = [
  "Centro de Distribuição - Videira, SC",
  "Centro de Distribuição - Videira, SC",
  "Base Regional - Joaçaba, SC",
  "Em rota - BR-153, SC",
  "Endereço de destino",
];

// ── Helpers ────────────────────────────────────────────────────────────

function broadcastToDelivery(deliveryId, event, data) {
  const subscribers = clients.get(deliveryId);
  if (!subscribers) return;
  for (const res of subscribers) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

function advanceDelivery(deliveryId) {
  const delivery = deliveries.get(deliveryId);
  if (!delivery || delivery.currentStage >= STAGES.length - 1) return;

  delivery.currentStage += 1;
  const stage = STAGES[delivery.currentStage];
  const location = LOCATIONS_POOL[delivery.currentStage];
  const now = new Date().toISOString();

  const update = {
    deliveryId,
    stage: delivery.currentStage,
    totalStages: STAGES.length,
    status: stage.status,
    label: stage.label,
    detail: stage.detail,
    location,
    timestamp: now,
  };

  delivery.history.push(update);
  broadcastToDelivery(deliveryId, "delivery-update", update);

  // Continua avançando a cada 4-7s enquanto não entregue
  if (delivery.currentStage < STAGES.length - 1) {
    const delay = 4000 + Math.random() * 3000;
    setTimeout(() => advanceDelivery(deliveryId), delay);
  }
}

// ── Rotas REST ─────────────────────────────────────────────────────────

// Cria nova entrega e inicia simulação
app.post("/api/deliveries", (_req, res) => {
  const id = uuidv4().slice(0, 8).toUpperCase();
  const now = new Date().toISOString();
  const firstStage = STAGES[0];

  const delivery = {
    id,
    currentStage: 0,
    createdAt: now,
    history: [
      {
        deliveryId: id,
        stage: 0,
        totalStages: STAGES.length,
        status: firstStage.status,
        label: firstStage.label,
        detail: firstStage.detail,
        location: LOCATIONS_POOL[0],
        timestamp: now,
      },
    ],
  };

  deliveries.set(id, delivery);
  clients.set(id, new Set());

  // Inicia avanço automático após 4-7s
  const delay = 4000 + Math.random() * 3000;
  setTimeout(() => advanceDelivery(id), delay);

  res.status(201).json({ deliveryId: id, message: "Entrega criada com sucesso." });
});

// Lista entregas ativas
app.get("/api/deliveries", (_req, res) => {
  const list = [];
  for (const [id, d] of deliveries) {
    list.push({
      id,
      currentStage: d.currentStage,
      status: STAGES[d.currentStage].label,
      createdAt: d.createdAt,
    });
  }
  res.json(list);
});

// ── SSE Endpoint ───────────────────────────────────────────────────────

app.get("/api/deliveries/:id/stream", (req, res) => {
  const deliveryId = req.params.id;
  const delivery = deliveries.get(deliveryId);

  if (!delivery) {
    return res.status(404).json({ error: "Entrega não encontrada." });
  }

  // Configura headers SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Envia estado atual (todo o histórico)
  for (const update of delivery.history) {
    res.write(`event: delivery-update\n`);
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  }

  // Heartbeat a cada 15s para manter conexão viva
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  // Registra cliente
  clients.get(deliveryId).add(res);

  // Cleanup ao desconectar
  req.on("close", () => {
    clearInterval(heartbeat);
    const subs = clients.get(deliveryId);
    if (subs) subs.delete(res);
  });
});

// ── Health check ───────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ──────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SSE Server] Rodando em http://localhost:${PORT}`);
});
