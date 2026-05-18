// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Bot — Gerenciamento de sessões e fluxo de conversa
// Versão: 3.0 — coleta mínima inicial
//
// Mudanças em relação à versão 2.2:
//   • Coleta mínima: nome (aceita primeiro nome) e perfil, antes da dúvida
//   • Telefone vem do Z-API automaticamente (sem confirmação)
//   • E-mail é solicitado apenas quando o usuário escolhe abrir um ticket
//   • Categoria foi eliminada: a IA recebe perfil + dúvida em linguagem livre
//   • Todo atendimento (FAQ, IA, ticket) é registrado na aba Atendimentos
//   • Fluxo: saudação → nome → perfil → dúvida → FAQ/IA → (se ticket) e-mail
// ═══════════════════════════════════════════════════════════════════════

const { MENSAGENS, PERFIS, CONFIG } = require("./config");
const { gerarResposta, verificarFAQ } = require("./claude");
const { salvarTicket, salvarAtendimento } = require("./sheets");

// ─── Armazenamento de sessões em memória ──────────────────────────────────
const sessoes = new Map();

// ─── Estados possíveis da conversa ────────────────────────────────────────
const ESTADOS = {
  AGUARDANDO_INICIO:       "aguardando_inicio",       // qualquer msg → boas-vindas + pede nome
  AGUARDANDO_NOME:         "aguardando_nome",         // aceita 1 ou + palavras
  AGUARDANDO_PERFIL:       "aguardando_perfil",       // Estudante/Educador/Gestor
  AGUARDANDO_DUVIDA:       "aguardando_duvida",       // pergunta aberta
  AGUARDANDO_AVALIACAO:    "aguardando_avaliacao",    // pós resposta (FAQ ou IA)
  AGUARDANDO_EMAIL_TICKET: "aguardando_email_ticket", // pede e-mail antes de gravar ticket
  AGUARDANDO_POS_TICKET:   "aguardando_pos_ticket",   // pós abertura de ticket
  ENCERRADO:               "encerrado",
};

// ─── Gerador de ID de ticket ───────────────────────────────────────────────
function gerarIdTicket() {
  const data = new Date();
  const prefixo = "LP";
  const ano  = data.getFullYear().toString().slice(-2);
  const mes  = String(data.getMonth() + 1).padStart(2, "0");
  const dia  = String(data.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefixo}-${ano}${mes}${dia}-${rand}`;
}

// ─── Criar nova sessão ─────────────────────────────────────────────────────
function criarSessao(telefone) {
  const sessao = {
    telefone,                       // número do Z-API (no formato internacional)
    estado: ESTADOS.AGUARDANDO_INICIO,
    nome: null,                     // nome completo digitado (pode ser só o primeiro)
    primeiro_nome: null,            // primeira palavra do nome
    email: null,                    // coletado apenas no momento do ticket
    perfil_id: null,
    perfil_nome: null,              // ex: "🎓 Estudante"
    duvida_atual: null,             // última dúvida descrita pelo usuário
    resposta_atual: null,           // última resposta dada (FAQ ou IA)
    origem_resposta: null,          // "FAQ" | "IA" | "Erro"
    historico: [],                  // histórico para a IA
    criada_em: Date.now(),
    ultima_atividade: Date.now(),
    contagem_mensagens: 0,
  };
  sessoes.set(telefone, sessao);
  return sessao;
}

// ─── Obter ou criar sessão ─────────────────────────────────────────────────
function obterSessao(telefone) {
  let sessao = sessoes.get(telefone);
  if (!sessao) return criarSessao(telefone);

  const inatividade = (Date.now() - sessao.ultima_atividade) / 1000 / 60;
  if (inatividade > CONFIG.timeout_sessao_minutos) {
    sessoes.delete(telefone);
    return criarSessao(telefone);
  }

  sessao.ultima_atividade = Date.now();
  return sessao;
}

// ─── Registrar atendimento anônimo (aba Atendimentos) ─────────────────────
// Chamado sempre que uma dúvida recebe resposta automatica (FAQ ou IA),
// independentemente de virar ou não ticket.
async function registrarAtendimento(sessao, virou_ticket) {
  try {
    const agora = new Date();
    await salvarAtendimento({
      data:             agora.toLocaleDateString("pt-BR"),
      hora:             agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      telefone:         sessao.telefone,
      perfil:           sessao.perfil_nome || "",
      duvida:           (sessao.duvida_atual || "").slice(0, 500),
      resposta:         (sessao.resposta_atual || "").slice(0, 500),
      origem:           sessao.origem_resposta || "",
      email:            sessao.email || "",
      municipio_estado: "",                       // reservado para futura integração
      virou_ticket:     virou_ticket ? "Sim" : "Não",
    });
  } catch (err) {
    console.error("[Atendimento] Falha ao registrar:", err.message);
  }
}

// ─── Abrir ticket ──────────────────────────────────────────────────────────
async function abrirTicket(sessao) {
  const ticketId = gerarIdTicket();
  const agora = new Date();

  const ticket = {
    id:        ticketId,
    data:      agora.toLocaleDateString("pt-BR"),
    hora:      agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    nome:      sessao.nome || "",
    telefone:  sessao.telefone,
    email:     sessao.email || "",
    perfil:    sessao.perfil_nome || "",
    duvida:    (sessao.duvida_atual || "").slice(0, 500),
  };

  await salvarTicket(ticket);
  // Registra o atendimento marcado como "virou ticket"
  await registrarAtendimento(sessao, true);
  return ticketId;
}

// ─── Processar mensagem recebida ──────────────────────────────────────────
async function processarMensagem(telefone, textoRecebido) {
  const sessao = obterSessao(telefone);
  const texto  = textoRecebido.trim();
  sessao.contagem_mensagens++;

  let resposta = null;

  // ── ESTADO: início — qualquer msg dispara boas-vindas e pede nome ─────
  if (sessao.estado === ESTADOS.AGUARDANDO_INICIO) {
    sessao.estado = ESTADOS.AGUARDANDO_NOME;
    resposta = MENSAGENS.boas_vindas;
  }

  // ── ESTADO: aguardando nome (aceita primeiro nome ou completo) ────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_NOME) {
    const partes = texto.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      resposta = `Por favor, digite seu *nome* para começarmos.`;
    } else {
      sessao.nome = texto.trim();
      sessao.primeiro_nome = partes[0];
      sessao.estado = ESTADOS.AGUARDANDO_PERFIL;
      resposta = MENSAGENS.selecionar_perfil(sessao.primeiro_nome);
    }
  }

  // ── ESTADO: aguardando perfil (1 / 2 / 3) ─────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_PERFIL) {
    if (!PERFIS[texto]) {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.selecionar_perfil(sessao.primeiro_nome);
    } else {
      sessao.perfil_id   = texto;
      sessao.perfil_nome = `${PERFIS[texto].emoji} ${PERFIS[texto].nome}`;
      sessao.estado      = ESTADOS.AGUARDANDO_DUVIDA;
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);
    }
  }

  // ── ESTADO: aguardando dúvida (pergunta aberta) ───────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_DUVIDA) {
    const duvida = texto;
    sessao.duvida_atual = duvida;

    // Primeiro tenta FAQ (sem custo de API)
    const respostaFAQ = verificarFAQ(duvida);
    if (respostaFAQ) {
      sessao.resposta_atual = respostaFAQ;
      sessao.origem_resposta = "FAQ";
      sessao.historico.push({ de: "usuario", texto: duvida });
      sessao.historico.push({ de: "bot", texto: respostaFAQ });
      sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
      resposta = respostaFAQ + "\n\n──────────\n" + MENSAGENS.pos_resposta_automatica;
    } else {
      // FAQ não casou: chama a IA com perfil + dúvida (sem categoria)
      sessao.historico.push({ de: "usuario", texto: duvida });
      const ia = await gerarResposta({
        perfil:        sessao.perfil_nome,
        categoria:     "Dúvida aberta",
        historico:     sessao.historico.slice(0, -1),
        mensagemAtual: duvida,
      });

      if (!ia) {
        sessao.resposta_atual = MENSAGENS.erro_tecnico;
        sessao.origem_resposta = "Erro";
        resposta = MENSAGENS.erro_tecnico;
      } else {
        sessao.resposta_atual = ia;
        sessao.origem_resposta = "IA";
        sessao.historico.push({ de: "bot", texto: ia });
        sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
        resposta = ia + "\n\n──────────\n" + MENSAGENS.pos_resposta_automatica;
      }
    }
  }

  // ── ESTADO: aguardando avaliação da resposta ──────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_AVALIACAO) {

    if (texto === "1") {
      // Resolvido — registra atendimento (sem ticket) e encerra
      await registrarAtendimento(sessao, false);
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.primeiro_nome);
      sessoes.delete(telefone);

    } else if (texto === "2") {
      // Outra pergunta — registra atendimento e volta à dúvida aberta
      await registrarAtendimento(sessao, false);
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = []; // limpa contexto para nova pergunta independente
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else if (texto === "3") {
      // Pedir e-mail antes de abrir o ticket
      sessao.estado = ESTADOS.AGUARDANDO_EMAIL_TICKET;
      resposta = MENSAGENS.solicitar_email_ticket;

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.pos_resposta_automatica;
    }
  }

  // ── ESTADO: aguardando e-mail para o ticket ───────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_EMAIL_TICKET) {
    sessao.email = texto.toLowerCase() === "pular" ? "" : texto;
    const ticketId = await abrirTicket(sessao);
    sessao.estado = ESTADOS.AGUARDANDO_POS_TICKET;
    resposta = MENSAGENS.ticket_aberto(ticketId);
  }

  // ── ESTADO: aguardando escolha pós-ticket ─────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_POS_TICKET) {

    if (texto === "1") {
      // Fazer outra pergunta — volta à dúvida aberta, mantém perfil
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = [];
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else if (texto === "2") {
      // Encerrar
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.primeiro_nome);
      sessoes.delete(telefone);

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.ticket_aberto_opcoes();
    }
  }

  // ── ESTADO: encerrado — qualquer mensagem reinicia ────────────────────
  else {
    sessoes.delete(telefone);
    criarSessao(telefone);
    sessoes.get(telefone).estado = ESTADOS.AGUARDANDO_NOME;
    resposta = MENSAGENS.boas_vindas;
  }

  return resposta || MENSAGENS.erro_tecnico;
}

// ─── Limpar sessões expiradas ──────────────────────────────────────────────
function limparSessoesExpiradas() {
  const agora = Date.now();
  for (const [tel, sessao] of sessoes.entries()) {
    const minutos = (agora - sessao.ultima_atividade) / 1000 / 60;
    if (minutos > CONFIG.timeout_sessao_minutos) sessoes.delete(tel);
  }
}

setInterval(limparSessoesExpiradas, 10 * 60 * 1000);

module.exports = { processarMensagem, ESTADOS };
