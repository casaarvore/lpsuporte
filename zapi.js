// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Z-API — Envio de mensagens via WhatsApp
// Versão: 1.0 — extraído do server.js para permitir envio proativo pelo bot
// ═══════════════════════════════════════════════════════════════════════

const axios = require("axios");

async function enviarMensagem(telefone, texto) {
  if (!texto) return false;
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
    return true;
  } catch (err) {
    console.error("[Z-API] Erro ao enviar mensagem:", err.response?.data || err.message);
    return false;
  }
}

module.exports = { enviarMensagem };
