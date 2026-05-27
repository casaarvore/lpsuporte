// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Bot — Gerenciamento de sessões e fluxo de conversa
// Versão: 3.1 — reconhecimento de usuário recorrente + localização
//
// Mudanças em relação à versão 3.0:
//   • Lookup automático na aba "Usuarios" ao abrir nova sessão
//   • Usuários recorrentes pulam direto para "Tem algo mais que posso ajudar?"
//   • Novos estados: AGUARDANDO_MUNICIPIO_ESTADO e AGUARDANDO_ESCOLA
//   • Coleta opcional de localização (município/estado, escola/secretaria),
//     com possibilidade de "pular" em ambos os campos
//   • Dados de localização gravados em Tickets e Atendimentos
//   • Cadastro do usuário na aba Usuarios após primeira coleta completa
// ═══════════════════════════════════════════════════════════════════════

const { MENSAGENS, PERFIS, CONFIG } = require("./config");
const { gerarResposta, verificarFAQ } = require("./claude");
const { salvarTicket, salvarAtendimento, buscarUsuario, salvarUsuario } = require("./sheets");

// ─── Armazenamento de sessões em memória ──────────────────────────────────
const sessoes = new Map();

// ─── Estados possíveis da conversa ────────────────────────────────────────
const ESTADOS = {
  AGUARDANDO_INICIO:                       "aguardando_inicio",
  AGUARDANDO_NOME:                         "aguardando_nome",
  AGUARDANDO_PERFIL:                       "aguardando_perfil",
  AGUARDANDO_MUNICIPIO_ESTADO:             "aguardando_municipio_estado",
  AGUARDANDO_ESCOLA:                       "aguardando_escola",
  AGUARDANDO_DUVIDA:                       "aguardando_duvida",
  AGUARDANDO_AVALIACAO:                    "aguardando_avaliacao",
  AGUARDANDO_CONFIRMA_TICKET_INCOMPREENSAO:"aguardando_confirma_ticket_incompreensao",
  AGUARDANDO_EMAIL_TICKET:                 "aguardando_email_ticket",
  AGUARDANDO_POS_TICKET:                   "aguardando_pos_ticket",
  ENCERRADO:                               "encerrado",
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

// ─── Criar nova sessão (com lookup na aba Usuarios) ────────────────────────
async function criarSessao(telefone) {
  const sessao = {
    telefone,
    estado: ESTADOS.AGUARDANDO_INICIO,
    nome: null,
    primeiro_nome: null,
    email: null,
    perfil_id: null,
    perfil_nome: null,
    municipio_estado: null,
    escola: null,
    duvida_atual: null,
    resposta_atual: null,
    origem_resposta: null,
    historico: [],
    criada_em: Date.now(),
    ultima_atividade: Date.now(),
    contagem_mensagens: 0,
    usuario_recorrente: false,
  };

  // Consulta a aba Usuarios para reconhecimento
  try {
    const usuario = await buscarUsuario(telefone);
    if (usuario) {
      sessao.usuario_recorrente = true;
      sessao.nome             = usuario.nome_completo;
      sessao.primeiro_nome    = usuario.primeiro_nome;
      sessao.perfil_id        = usuario.perfil_id;
      sessao.perfil_nome      = usuario.perfil_nome;
      sessao.municipio_estado = usuario.municipio_estado;
      sessao.escola           = usuario.escola;
      sessao.email            = usuario.email;
    }
  } catch (err) {
    console.error("[Bot] Erro no lookup de usuário recorrente:", err.message);
  }

  sessoes.set(telefone, sessao);
  return sessao;
}

// ─── Obter ou criar sessão ─────────────────────────────────────────────────
async function obterSessao(telefone) {
  let sessao = sessoes.get(telefone);
  if (!sessao) return await criarSessao(telefone);

  const inatividade = (Date.now() - sessao.ultima_atividade) / 1000 / 60;
  if (inatividade > CONFIG.timeout_sessao_minutos) {
    sessoes.delete(telefone);
    return await criarSessao(telefone);
  }

  sessao.ultima_atividade = Date.now();
  return sessao;
}

// ─── Registrar atendimento (aba Atendimentos) ─────────────────────────────
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
      municipio_estado: sessao.municipio_estado || "",
      escola:           sessao.escola || "",
      virou_ticket:     virou_ticket ? "Sim" : "Não",
    });
  } catch (err) {
    console.error("[Atendimento] Falha ao registrar:", err.message);
  }
}

// ─── Cadastrar usuário (apenas se ainda não estiver na aba) ───────────────
async function cadastrarUsuarioSeNovo(sessao) {
  if (sessao.usuario_recorrente) return; // não sobrescreve
  try {
    await salvarUsuario({
      telefone:         sessao.telefone,
      nome_completo:    sessao.nome || "",
      primeiro_nome:    sessao.primeiro_nome || "",
      perfil_id:        sessao.perfil_id || "",
      perfil_nome:      sessao.perfil_nome || "",
      municipio_estado: sessao.municipio_estado || "",
      escola:           sessao.escola || "",
      email:            sessao.email || "",
    });
    sessao.usuario_recorrente = true;
  } catch (err) {
    console.error("[Usuario] Falha ao cadastrar:", err.message);
  }
}

// ─── Abrir ticket ──────────────────────────────────────────────────────────
async function abrirTicket(sessao) {
  const ticketId = gerarIdTicket();
  const agora = new Date();

  const ticket = {
    id:               ticketId,
    data:             agora.toLocaleDateString("pt-BR"),
    hora:             agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    nome:             sessao.nome || "",
    telefone:         sessao.telefone,
    email:            sessao.email || "",
    perfil:           sessao.perfil_nome || "",
    municipio_estado: sessao.municipio_estado || "",
    escola:           sessao.escola || "",
    duvida:           (sessao.duvida_atual || "").slice(0, 500),
  };

  await salvarTicket(ticket);
  await registrarAtendimento(sessao, true);
  return ticketId;
}

// ─── Processar mensagem recebida ──────────────────────────────────────────
async function processarMensagem(telefone, textoRecebido) {
  const sessao = await obterSessao(telefone);
  const texto  = textoRecebido.trim();
  sessao.contagem_mensagens++;

  let resposta = null;

  // ── ESTADO: início ────────────────────────────────────────────────────
  if (sessao.estado === ESTADOS.AGUARDANDO_INICIO) {
    if (sessao.usuario_recorrente) {
      // Usuário já cadastrado: pula direto para dúvida aberta
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      resposta = MENSAGENS.boas_vindas_retorno(sessao.primeiro_nome);
    } else {
      sessao.estado = ESTADOS.AGUARDANDO_NOME;
      resposta = MENSAGENS.boas_vindas;
    }
  }

  // ── ESTADO: aguardando nome ───────────────────────────────────────────
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

  // ── ESTADO: aguardando perfil ─────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_PERFIL) {
    if (!PERFIS[texto]) {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.selecionar_perfil(sessao.primeiro_nome);
    } else {
      sessao.perfil_id   = texto;
      sessao.perfil_nome = `${PERFIS[texto].emoji} ${PERFIS[texto].nome}`;
      sessao.estado      = ESTADOS.AGUARDANDO_MUNICIPIO_ESTADO;
      resposta = MENSAGENS.solicitar_municipio_estado(sessao.primeiro_nome);
    }
  }

  // ── ESTADO: aguardando município e estado ─────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_MUNICIPIO_ESTADO) {
    sessao.municipio_estado = texto.toLowerCase() === "pular" ? "" : texto;
    sessao.estado = ESTADOS.AGUARDANDO_ESCOLA;
    resposta = MENSAGENS.solicitar_escola;
  }

  // ── ESTADO: aguardando escola / secretaria ────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_ESCOLA) {
    sessao.escola = texto.toLowerCase() === "pular" ? "" : texto;
    // Cadastra o usuário na aba Usuarios (assíncrono, não bloqueia)
    cadastrarUsuarioSeNovo(sessao);
    sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
    resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);
  }

  // ── ESTADO: aguardando dúvida ─────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_DUVIDA) {
    const duvida = texto;
    sessao.duvida_atual = duvida;

    const respostaFAQ = verificarFAQ(duvida);
    if (respostaFAQ) {
      sessao.resposta_atual = respostaFAQ;
      sessao.origem_resposta = "FAQ";
      sessao.historico.push({ de: "usuario", texto: duvida });
      sessao.historico.push({ de: "bot", texto: respostaFAQ });
      sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
      resposta = respostaFAQ + "\n\n──────────\n" + MENSAGENS.pos_resposta_automatica;
    } else {
      sessao.historico.push({ de: "usuario", texto: duvida });
      const ia = await gerarResposta({
        perfil:        sessao.perfil_nome,
        categoria:     "Dúvida aberta",
        historico:     sessao.historico.slice(0, -1),
        mensagemAtual: duvida,
      });

      if (!ia) {
        // IA falhou ou retornou vazio: oferece encaminhamento para atendimento humano
        sessao.resposta_atual = MENSAGENS.nao_compreendi_oferecer_ticket;
        sessao.origem_resposta = "Erro";
        sessao.estado = ESTADOS.AGUARDANDO_CONFIRMA_TICKET_INCOMPREENSAO;
        resposta = MENSAGENS.nao_compreendi_oferecer_ticket;
      } else {
        sessao.resposta_atual = ia;
        sessao.origem_resposta = "IA";
        sessao.historico.push({ de: "bot", texto: ia });
        sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
        resposta = ia + "\n\n──────────\n" + MENSAGENS.pos_resposta_automatica;
      }
    }
  }

  // ── ESTADO: aguardando avaliação ──────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_AVALIACAO) {

    if (texto === "1") {
      await registrarAtendimento(sessao, false);
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.primeiro_nome);
      sessoes.delete(telefone);

    } else if (texto === "2") {
      await registrarAtendimento(sessao, false);
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = [];
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else if (texto === "3") {
      sessao.estado = ESTADOS.AGUARDANDO_EMAIL_TICKET;
      resposta = MENSAGENS.solicitar_email_ticket;

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.pos_resposta_automatica;
    }
  }

  // ── ESTADO: aguardando confirmação de ticket por incompreensão da IA ──
  // Aciona quando a IA falhou ou não conseguiu processar a pergunta; permite
  // ao usuário decidir entre encaminhar para atendimento humano ou reformular.
  else if (sessao.estado === ESTADOS.AGUARDANDO_CONFIRMA_TICKET_INCOMPREENSAO) {

    if (texto === "1") {
      sessao.estado = ESTADOS.AGUARDANDO_EMAIL_TICKET;
      resposta = MENSAGENS.solicitar_email_ticket;

    } else if (texto === "2") {
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = [];
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.nao_compreendi_oferecer_ticket;
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
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = [];
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else if (texto === "2") {
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
    const novaSessao = await criarSessao(telefone);
    // Se é recorrente, saúda como recorrente; se não, fluxo padrão
    if (novaSessao.usuario_recorrente) {
      novaSessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      resposta = MENSAGENS.boas_vindas_retorno(novaSessao.primeiro_nome);
    } else {
      novaSessao.estado = ESTADOS.AGUARDANDO_NOME;
      resposta = MENSAGENS.boas_vindas;
    }
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
