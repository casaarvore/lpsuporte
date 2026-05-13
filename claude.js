// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: IA — Geração de respostas contextualizadas ao Learning Passport
//
// v3.0 — Migrado de Anthropic Claude para OpenAI GPT-4o-mini
//   • Endpoint: https://api.openai.com/v1/chat/completions
//   • Modelo: gpt-4o-mini (custo baixo, qualidade alta para suporte)
//   • Variável de ambiente: OPENAI_API_KEY
//   • FAQ local mantido — evita chamadas desnecessárias à API
//   • Fallback de erro mantido — bot continua funcionando se API falhar
// ═══════════════════════════════════════════════════════════════════════

const axios = require("axios");
const { CONTEXTO_IA, FAQ } = require("./config");

// ─── Verificar FAQ local antes de chamar a IA ─────────────────────────────
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

// ─── Chamar OpenAI API ────────────────────────────────────────────────────
async function gerarResposta({ perfil, categoria, historico, mensagemAtual }) {
  // Tenta FAQ primeiro — evita custo de API para perguntas comuns
  const respostaFAQ = verificarFAQ(mensagemAtual);
  if (respostaFAQ) {
    console.log("[IA] Respondido via FAQ local.");
    return respostaFAQ;
  }

  try {
    const systemPrompt = `${CONTEXTO_IA}

Contexto desta conversa:
- Perfil do usuário: ${perfil}
- Categoria da dúvida: ${categoria}

Responda de forma direta e prática. Use formatação simples compatível com WhatsApp (*negrito*, listas com números ou ✔️). Máximo 3 parágrafos.`;

    // Monta histórico no formato OpenAI
    const mensagens = [
      { role: "system", content: systemPrompt },
      ...historico.map((m) => ({
        role: m.de === "usuario" ? "user" : "assistant",
        content: m.texto,
      })),
      { role: "user", content: mensagemAtual },
    ];

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: mensagens,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const texto = response.data.choices?.[0]?.message?.content;
    if (!texto) throw new Error("Resposta vazia da API");

    console.log("[IA] Resposta gerada com sucesso via OpenAI.");
    return texto;
  } catch (err) {
    console.error("[IA] Erro ao chamar OpenAI:", err.response?.data?.error?.message || err.message);
    return null;
  }
}

module.exports = { gerarResposta, verificarFAQ };
