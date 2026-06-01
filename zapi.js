// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Z-API — Envio de mensagens via WhatsApp
// Versão: 2.0 — adicionado suporte a botões interativos (send-button-actions)
//
// O envio de botões requer plano pago do Z-API. Em caso de falha (plano
// incompatível, número de WhatsApp Business sem suporte, instabilidade),
// o módulo faz fallback automático para envio de texto simples.
// ═══════════════════════════════════════════════════════════════════════

const axios = require("axios");

// ─── Envio de mensagem de texto simples ───────────────────────────────────
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

// ─── Envio de mensagem com botões interativos ─────────────────────────────
// botoes = [{ id: "1", label: "Texto do botão" }, ...] (máximo 3 botões)
// O texto da mensagem deve incluir, idealmente, também a lista numerada das
// opções para usuários cujos clientes não renderizam botões interativos.
async function enviarBotoes(telefone, mensagem, botoes) {
  if (!mensagem || !Array.isArray(botoes) || botoes.length === 0) return false;

  try {
    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const token = process.env.ZAPI_TOKEN;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;

    await axios.post(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-button-actions`,
      {
        phone: telefone,
        message: mensagem,
        buttonActions: botoes.slice(0, 3).map((b) => ({
          id:    String(b.id),
          type:  "REPLY",
          label: String(b.label).slice(0, 20),
        })),
      },
      { headers: { "Client-Token": clientToken } }
    );
    console.log(`[Z-API] Botões enviados para ${telefone} (${botoes.length} botões)`);
    return true;

  } catch (err) {
    console.error("[Z-API] Erro ao enviar botões:", err.response?.data || err.message);
    console.log("[Z-API] Aplicando fallback: enviando como texto simples.");
    // Fallback: envia apenas o texto, que já contém as opções numeradas
    return enviarMensagem(telefone, mensagem);
  }
}

module.exports = { enviarMensagem, enviarBotoes };
