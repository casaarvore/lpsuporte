// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: IA — Geração de respostas contextualizadas ao Learning Passport
//
// v3.1 — Prompt enriquecido com base estruturada, índice da FAQ e guardrails
//   • Endpoint: https://api.openai.com/v1/chat/completions
//   • Modelo: gpt-4o-mini (custo baixo, qualidade alta para suporte)
//   • Variável de ambiente: OPENAI_API_KEY
//   • FAQ local mantido — evita chamadas desnecessárias à API
//   • NOVO: KNOWLEDGE_SYNTHESIS (listas estruturadas) anexado ao prompt
//   • NOVO: índice de perguntas da FAQ enviado como contexto de fallback
//   • NOVO: guardrails explícitos para reduzir alucinações
//   • Fallback de erro mantido — bot continua funcionando se API falhar
// ═══════════════════════════════════════════════════════════════════════

const axios = require("axios");
const { CONTEXTO_IA, FAQ, KNOWLEDGE_SYNTHESIS } = require("./config");

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

// ─── Construir índice compacto da FAQ para a IA ───────────────────────────
// Resume cada entrada da FAQ em uma linha (tópico + palavras-chave principais)
// para que a IA possa reconhecer perguntas similares e adotar a resposta canônica.
function montarIndiceFAQ() {
  return FAQ.map((entrada, i) => {
    // Extrai o tópico (texto entre asteriscos da primeira linha da resposta).
    // [^*\n]+ garante que o capture fique contido na linha, evitando capturar
    // o segundo asterisco que pode aparecer mais adiante no corpo da resposta.
    const m = entrada.resposta.match(/^[^\n]*?\*([^*\n]+)\*/);
    let topico = m ? m[1].trim() : entrada.resposta.split("\n")[0].slice(0, 80).trim();
    topico = topico.replace(/[:\?]$/, "");
    const palavrasChave = entrada.keywords.slice(0, 5).join(", ");
    return `${(i + 1).toString().padStart(2, "0")}. ${topico}  (palavras: ${palavrasChave})`;
  }).join("\n");
}

// ─── Guardrails (instruções explícitas para a IA) ─────────────────────────
// Reduzem alucinações e padronizam o comportamento em casos de incerteza.
const GUARDRAILS = `
INSTRUÇÕES OBRIGATÓRIAS PARA SUAS RESPOSTAS:

1. Use APENAS as informações fornecidas neste contexto. Não invente nomes de telas, botões, opções de menu ou funcionalidades que não estejam descritas aqui.

2. Se a pergunta for sobre algo NÃO COBERTO pelo contexto, responda: "Não tenho essa informação específica no momento. Recomendo abrir um ticket marcando 'Não' na próxima opção, para que um ponto focal possa ajudá-lo." Não tente adivinhar.

3. Se a pergunta do usuário for SIMILAR a um item do INDEX FAQ abaixo, prefira adotar a resposta canônica desse item (adaptando ligeiramente ao contexto da conversa).

4. Mantenha respostas CURTAS e diretas para WhatsApp: máximo 3 parágrafos. Use *negrito* (asteriscos) e listas numeradas quando ajudar a clareza. Não use formatação Markdown complexa.

5. Em dúvidas sobre acesso, login ou senha que persistam, sempre mencione o WhatsApp de suporte: +55 19 99590-8410.

6. Quando o usuário pedir orientação visual ou passo a passo COM IMAGENS, encaminhe ao tutorial em: passaporteparaaprendizagem.casadaarvore.art.br/tutorial.html

7. NÃO prometa funcionalidades que dependem de outras pessoas (por exemplo, não prometa prazos diferentes do oficial: "até 24 horas em dias úteis").
`;

// ─── Chamar OpenAI API ────────────────────────────────────────────────────
async function gerarResposta({ perfil, categoria, historico, mensagemAtual }) {
  // Tenta FAQ primeiro — evita custo de API para perguntas comuns
  const respostaFAQ = verificarFAQ(mensagemAtual);
  if (respostaFAQ) {
    console.log("[IA] Respondido via FAQ local.");
    return respostaFAQ;
  }

  try {
    const indiceFAQ = montarIndiceFAQ();

    const systemPrompt = `${CONTEXTO_IA}

${KNOWLEDGE_SYNTHESIS}

ÍNDICE DE PERGUNTAS JÁ COBERTAS PELA FAQ (consulte e adapte se a pergunta do usuário for similar):
${indiceFAQ}

${GUARDRAILS}

CONTEXTO DESTA CONVERSA:
- Perfil do usuário: ${perfil}
- Categoria da dúvida: ${categoria}

Responda de forma direta e prática, com formatação compatível com WhatsApp (*negrito*, listas com números ou ✔️). Máximo 3 parágrafos.`;

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
