// ═══════════════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL — Learning Passport Suporte
// ─ Recebe mensagens do Z-API (WhatsApp)
// ─ Serve o painel web de gestão
// ─ Expõe API para o painel
// ═══════════════════════════════════════════════════════════════════════

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const { processarMensagem } = require("./bot");
const { listarTickets, buscarPontosFocais, cadastrarPontoFocal } = require("./sheets");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // painel web

const PORT = process.env.PORT || 3000;

// ─── Função: enviar mensagem pelo Z-API ───────────────────────────────────
async function enviarMensagem(telefone, texto) {
  try {
    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const token = process.env.ZAPI_TOKEN;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;

    await axios.post(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      { phone: telefone, message: texto },
      { headers: { "Client-Token": clientToken } }
    );
    console.log(`[Z-API] Mensagem enviada para ${telefone}`);
  } catch (err) {
    console.error("[Z-API] Erro ao enviar mensagem:", err.response?.data || err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// WEBHOOK — Recebe mensagens do WhatsApp via Z-API
// ═══════════════════════════════════════════════════════════════════════
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Responde imediatamente ao Z-API

  try {
    const body = req.body;

    // Ignora mensagens enviadas pelo próprio bot e grupos
    if (body.fromMe || body.isGroup || !body.text?.message) return;

    const telefone = body.phone;
    const texto = body.text.message;

    console.log(`[Webhook] Mensagem de ${telefone}: "${texto}"`);

    const resposta = await processarMensagem(telefone, texto);
    await enviarMensagem(telefone, resposta);

  } catch (err) {
    console.error("[Webhook] Erro:", err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// API DO PAINEL WEB
// ═══════════════════════════════════════════════════════════════════════

// GET /api/tickets — lista todos os tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await listarTickets();
    res.json({ ok: true, tickets });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// GET /api/pontos-focais — lista pontos focais cadastrados
app.get("/api/pontos-focais", async (req, res) => {
  try {
    const pontos = await buscarPontosFocais();
    res.json({ ok: true, pontos });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// POST /api/pontos-focais — cadastra novo ponto focal
app.post("/api/pontos-focais", async (req, res) => {
  try {
    const { escola, municipio, estado, nome_focal, whatsapp, email } = req.body;
    if (!escola || !nome_focal || !whatsapp) {
      return res.status(400).json({ ok: false, erro: "Campos obrigatórios: escola, nome_focal, whatsapp" });
    }
    const ok = await cadastrarPontoFocal({ escola, municipio, estado, nome_focal, whatsapp, email });
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// GET /api/status — health check
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    servico: "Learning Passport Suporte Bot",
    horario: new Date().toLocaleString("pt-BR"),
    versao: "1.0.0",
  });
});

// ─── Rota fallback para o painel (SPA) ────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Iniciar servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📋 Painel: http://localhost:${PORT}`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`📊 API:     http://localhost:${PORT}/api/tickets\n`);
});
