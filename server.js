// ═══════════════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL — Learning Passport Suporte
// ─ Recebe mensagens do Z-API (WhatsApp)
// ─ Serve o painel web de gestão
// ─ Expõe API para o painel
// ═══════════════════════════════════════════════════════════════════════

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { processarMensagem, processarComandoHumano, registrarAtividadeHumana } = require("./bot");
const { listarTickets, buscarPontosFocais, cadastrarPontoFocal } = require("./sheets");
const { enviarMensagem, enviarBotoes } = require("./zapi");

// ─── Helpers ──────────────────────────────────────────────────────────────
// Extrai a "resposta efetiva" do payload do webhook. Quando o usuário toca
// num botão interativo, o ID do botão é o que importa (não o label).
function extrairTexto(body) {
  if (body.buttonsResponseMessage && body.buttonsResponseMessage.buttonId) {
    return body.buttonsResponseMessage.buttonId;
  }
  if (body.buttonReply && body.buttonReply.buttonId) {
    return body.buttonReply.buttonId;
  }
  if (body.listResponseMessage && body.listResponseMessage.singleSelectReply) {
    return body.listResponseMessage.singleSelectReply.selectedRowId;
  }
  return body.text && body.text.message;
}

// Envia um único item (string ou objeto com botões).
async function enviarItem(telefone, item) {
  if (typeof item === "string") {
    return enviarMensagem(telefone, item);
  }
  if (item && typeof item === "object" && Array.isArray(item.botoes)) {
    return enviarBotoes(telefone, item.texto || "", item.botoes);
  }
  return false;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // painel web

const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════
// WEBHOOK — Recebe mensagens do WhatsApp via Z-API
// ═══════════════════════════════════════════════════════════════════════
// Tratamento de mensagens fromMe (versão 3.2 com handoff humano):
//   • fromMe + texto começando com "#" → comando administrativo do ponto focal
//   • fromMe + texto comum            → resposta manual do ponto focal
//                                         (atualiza timestamp de atividade humana)
//   • !fromMe                         → mensagem do usuário (fluxo normal do bot)
// ═══════════════════════════════════════════════════════════════════════
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Responde imediatamente ao Z-API

  try {
    const body = req.body;

    // Ignora grupos
    if (body.isGroup) return;

    const telefone = body.phone;
    const texto    = extrairTexto(body);
    if (!texto) return;  // mensagem sem texto utilizável

    if (body.fromMe) {
      // Mensagem da conta do bot. Pode ser:
      // (1) Eco do envio automático pelo próprio bot (será ignorado abaixo)
      // (2) Comando administrativo do ponto focal (começa com "#")
      // (3) Resposta manual do ponto focal via WhatsApp Web
      const t = (texto || "").trim();
      if (t.startsWith("#")) {
        console.log(`[Webhook] Comando do ponto focal para ${telefone}: ${t}`);
        await processarComandoHumano(telefone, t);
      } else {
        // Atualiza timestamp de atividade humana, se houver atendimento em curso
        registrarAtividadeHumana(telefone);
      }
      return;
    }

    console.log(`[Webhook] Mensagem de ${telefone}: "${texto}"`);

    const resposta = await processarMensagem(telefone, texto);
    if (resposta) {
      // Suporta três formatos de retorno:
      //   • string                              → texto simples
      //   • { texto, botoes }                   → mensagem com botões interativos
      //   • array de strings ou objetos acima   → mensagens sequenciais com 1.2s
      // O envio em sequência com pequeno intervalo evita o efeito de "muro de
      // texto" e dá ritmo mais natural à conversa.
      if (Array.isArray(resposta)) {
        for (let i = 0; i < resposta.length; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 1200));
          if (resposta[i]) await enviarItem(telefone, resposta[i]);
        }
      } else {
        await enviarItem(telefone, resposta);
      }
    } else {
      console.log(`[Webhook] Bot silencioso para ${telefone} (atendimento humano).`);
    }

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
