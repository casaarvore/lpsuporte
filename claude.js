// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Claude IA
// Gera respostas contextualizadas ao Learning Passport
// ═══════════════════════════════════════════════════════════════════════

const axios = require("axios");
const { CONTEXTO_IA, FAQ } = require("./config");

// ─── Verificar FAQ local antes de chamar a IA ──────────────────────────────
// Economiza tokens da API quando a pergunta é comum
function verificarFAQ(mensagem) {
  const texto = mensagem.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.length > 0 && item.keywords.some((kw) => texto.includes(kw))) {
      return item.resposta;
    }
  }
  return null;
}

// ─── Chamar Claude API ─────────────────────────────────────────────────────
async function gerarResposta({ perfil, categoria, historico, mensagemAtual }) {
  // Tenta FAQ primeiro
  const respostaFAQ = verificarFAQ(mensagemAtual);
  if (respostaFAQ) {
    console.log("[Claude] Respondido via FAQ local.");
    return respostaFAQ;
  }

  try {
    const systemPrompt = `${CONTEXTO_IA}

Contexto desta conversa:
- Perfil do usuário: ${perfil}
- Categoria da dúvida: ${categoria}

Responda de forma direta e prática. Use formatação simples compatível com WhatsApp (*negrito*, listas com números ou ✔️). Máximo 3 parágrafos.`;

    // Monta histórico de mensagens para contexto
    const mensagens = historico.map((m) => ({
      role: m.de === "usuario" ? "user" : "assistant",
      content: m.texto,
    }));
    mensagens.push({ role: "user", content: mensagemAtual });

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: mensagens,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        timeout: 30000,
      }
    );

    const texto = response.data.content?.[0]?.text;
    if (!texto) throw new Error("Resposta vazia da API");

    console.log("[Claude] Resposta gerada com sucesso.");
    return texto;
  } catch (err) {
    console.error("[Claude] Erro:", err.message);
    return null; // server.js trata o null com mensagem de erro
  }
}

module.exports = { gerarResposta, verificarFAQ };
