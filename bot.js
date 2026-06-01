// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Bot — Gerenciamento de sessões e fluxo de conversa
// Versão: 3.2 — handoff humano com comandos e avaliação automatizada
//
// Mudanças em relação à versão 3.1:
//   • Novo: flags humano_atendendo e humano_desde por sessão
//   • Novo: comandos #humano, #bot, #avaliar (processados via server.js)
//   • Novo: estado AGUARDANDO_AVALIACAO_HUMANO
//   • Novo: tarefa periódica que detecta timeout de 30 min e envia avaliação
//   • Quando humano_atendendo=true, bot retorna null (não responde)
// ═══════════════════════════════════════════════════════════════════════

const { MENSAGENS, PERFIS, CONFIG, BOTOES } = require("./config");
const { gerarResposta, verificarFAQ } = require("./claude");
const { salvarTicket, salvarAtendimento, buscarUsuario, salvarUsuario } = require("./sheets");
const { enviarMensagem } = require("./zapi");

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
  AGUARDANDO_DESCRICAO_PROBLEMA:           "aguardando_descricao_problema",
  AGUARDANDO_EMAIL_TICKET:                 "aguardando_email_ticket",
  AGUARDANDO_PAUSA_USUARIO:                "aguardando_pausa_usuario",
  AGUARDANDO_POS_TICKET:                   "aguardando_pos_ticket",
  AGUARDANDO_AVALIACAO_HUMANO:             "aguardando_avaliacao_humano",
  ENCERRADO:                               "encerrado",
};

// Tempo (em minutos) de inatividade do atendimento humano antes do bot
// retomar o controle e enviar a avaliação automática.
const TIMEOUT_HUMANO_MIN = 30;

// ─── Helper: monta objeto mensagem com botões interativos ────────────────
// O server.js detecta { texto, botoes } e envia via Z-API send-button-actions
// (com fallback automático para texto simples caso a API falhe).
//
// IMPORTANTE: respeita a flag CONFIG.usar_botoes. Caso o plano do Z-API
// não esteja entregando botões corretamente (silêncio, mensagens vazias),
// basta setar CONFIG.usar_botoes = false em config.js para o bot voltar
// imediatamente ao envio de texto puro com a lista numerada de opções
// (que já consta no próprio texto da mensagem).
function comBotoes(texto, botoes) {
  if (!CONFIG.usar_botoes) return texto;
  return { texto, botoes };
}

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
    humano_atendendo: false,           // true quando o ponto focal assumiu a conversa
    humano_desde: null,                // timestamp da última atividade do humano
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

  // ── Atendimento humano em curso: bot não responde ────────────────────
  if (sessao.humano_atendendo) {
    const minutos = (Date.now() - (sessao.humano_desde || 0)) / 1000 / 60;
    if (minutos <= TIMEOUT_HUMANO_MIN) {
      console.log(`[Bot] ${telefone} sob atendimento humano; bot silencioso.`);
      return null;  // null = server.js NÃO envia mensagem
    }
    // Timeout expirou: encerra atendimento humano e dispara avaliação
    sessao.humano_atendendo = false;
    sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO_HUMANO;
    return MENSAGENS.avaliacao_pos_humano(sessao.primeiro_nome || "");
  }

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
      resposta = comBotoes(MENSAGENS.selecionar_perfil(sessao.primeiro_nome), BOTOES.perfil);
    }
  }

  // ── ESTADO: aguardando perfil ─────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_PERFIL) {
    if (!PERFIS[texto]) {
      resposta = comBotoes(
        MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.selecionar_perfil(sessao.primeiro_nome),
        BOTOES.perfil
      );
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
      // Envia em duas mensagens sequenciais (resposta + avaliação com botões)
      resposta = [respostaFAQ, comBotoes(MENSAGENS.pos_resposta_automatica, BOTOES.avaliacao)];
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
        resposta = comBotoes(MENSAGENS.nao_compreendi_oferecer_ticket, BOTOES.incompreensao);
      } else {
        sessao.resposta_atual = ia;
        sessao.origem_resposta = "IA";
        sessao.historico.push({ de: "bot", texto: ia });
        sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
        // Mesmo padrão de fragmentação adotado para o FAQ
        resposta = [ia, comBotoes(MENSAGENS.pos_resposta_automatica, BOTOES.avaliacao)];
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
      // Antes de pedir e-mail, solicita descrição detalhada do problema
      sessao.estado = ESTADOS.AGUARDANDO_DESCRICAO_PROBLEMA;
      resposta = MENSAGENS.solicitar_descricao_problema;

    } else {
      resposta = comBotoes(
        MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.pos_resposta_automatica,
        BOTOES.avaliacao
      );
    }
  }

  // ── ESTADO: aguardando confirmação de ticket por incompreensão da IA ──
  // Aciona quando a IA falhou ou não conseguiu processar a pergunta; permite
  // ao usuário decidir entre encaminhar para atendimento humano ou reformular.
  else if (sessao.estado === ESTADOS.AGUARDANDO_CONFIRMA_TICKET_INCOMPREENSAO) {

    if (texto === "1") {
      sessao.estado = ESTADOS.AGUARDANDO_DESCRICAO_PROBLEMA;
      resposta = MENSAGENS.solicitar_descricao_problema;

    } else if (texto === "2") {
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = [];
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else {
      resposta = comBotoes(
        MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.nao_compreendi_oferecer_ticket,
        BOTOES.incompreensao
      );
    }
  }

  // ── ESTADO: aguardando descrição detalhada do problema (antes do ticket) ─
  // O texto digitado aqui substitui a dúvida_atual e será gravado no ticket
  // como descrição principal para o ponto focal.
  else if (sessao.estado === ESTADOS.AGUARDANDO_DESCRICAO_PROBLEMA) {
    sessao.duvida_atual = texto;
    sessao.estado = ESTADOS.AGUARDANDO_EMAIL_TICKET;
    resposta = MENSAGENS.solicitar_email_ticket;
  }

  // ── ESTADO: aguardando e-mail para o ticket ───────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_EMAIL_TICKET) {
    sessao.email = texto.toLowerCase() === "pular" ? "" : texto;
    const ticketId = await abrirTicket(sessao);
    sessao.estado = ESTADOS.AGUARDANDO_PAUSA_USUARIO;
    // Envia confirmação e oferta de pausa em duas mensagens sequenciais
    resposta = [
      MENSAGENS.ticket_aberto(ticketId),
      comBotoes(MENSAGENS.oferta_pausa, BOTOES.pausa),
    ];
  }

  // ── ESTADO: aguardando resposta sobre pausa de 30 minutos (S/N) ───────
  // Aciona logo após a abertura do ticket. O usuário pode optar por silenciar
  // o bot por 30 minutos (reusa a mesma lógica de humano_atendendo).
  else if (sessao.estado === ESTADOS.AGUARDANDO_PAUSA_USUARIO) {
    const t = texto.toLowerCase().trim();
    if (t === "s" || t === "sim") {
      sessao.humano_atendendo = true;
      sessao.humano_desde = Date.now();
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.pausa_confirmada;
    } else if (t === "n" || t === "nao" || t === "não") {
      sessao.estado = ESTADOS.AGUARDANDO_POS_TICKET;
      resposta = comBotoes(MENSAGENS.ticket_aberto_opcoes(), BOTOES.pos_ticket);
    } else {
      resposta = `Por favor, responda com *S* (Sim, pausar) ou *N* (Não, manter bot).`;
    }
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
      resposta = comBotoes(
        MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.ticket_aberto_opcoes(),
        BOTOES.pos_ticket
      );
    }
  }

  // ── ESTADO: aguardando avaliação após atendimento humano ──────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_AVALIACAO_HUMANO) {

    if (texto === "1") {
      // Resolvido
      sessao.duvida_atual    = sessao.duvida_atual || "Atendimento humano (resolvido)";
      sessao.resposta_atual  = "Atendimento humano marcado como resolvido pelo usuário";
      sessao.origem_resposta = "Humano";
      await registrarAtendimento(sessao, false);
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.primeiro_nome);
      sessoes.delete(telefone);

    } else if (texto === "2") {
      // Nova dúvida
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      sessao.historico = [];
      resposta = MENSAGENS.digitar_duvida(sessao.primeiro_nome);

    } else if (texto === "3") {
      // Solicitar agendamento de Google Meet — passa pela descrição
      sessao.duvida_atual = "[MEET] Solicitação de agendamento por Google Meet";
      sessao.estado = ESTADOS.AGUARDANDO_DESCRICAO_PROBLEMA;
      resposta = MENSAGENS.solicitar_descricao_problema;

    } else if (texto === "4") {
      // Novo ticket — passa pela descrição
      sessao.estado = ESTADOS.AGUARDANDO_DESCRICAO_PROBLEMA;
      resposta = MENSAGENS.solicitar_descricao_problema;

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n"
               + MENSAGENS.avaliacao_pos_humano(sessao.primeiro_nome || "");
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
    // Não expira sessões com atendimento humano em curso
    if (minutos > CONFIG.timeout_sessao_minutos && !sessao.humano_atendendo) {
      sessoes.delete(tel);
    }
  }
}

setInterval(limparSessoesExpiradas, 10 * 60 * 1000);

// ─── Tarefa periódica: detectar timeout de atendimento humano ─────────────
// A cada 5 minutos, percorre as sessões; quando o ponto focal ficou inativo
// por mais de TIMEOUT_HUMANO_MIN minutos, encerra o atendimento humano e
// envia ao usuário a mensagem de avaliação.
async function verificarHumanosInativos() {
  const agora = Date.now();
  for (const [tel, sessao] of sessoes.entries()) {
    if (!sessao.humano_atendendo) continue;
    const minutos = (agora - (sessao.humano_desde || 0)) / 1000 / 60;
    if (minutos > TIMEOUT_HUMANO_MIN) {
      sessao.humano_atendendo = false;
      sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO_HUMANO;
      console.log(`[Bot] Timeout do humano para ${tel}, enviando avaliação.`);
      try {
        await enviarMensagem(tel, MENSAGENS.avaliacao_pos_humano(sessao.primeiro_nome || ""));
      } catch (err) {
        console.error("[Bot] Erro ao enviar avaliação automática:", err.message);
      }
    }
  }
}

setInterval(verificarHumanosInativos, 5 * 60 * 1000);

// ─── Funções públicas para comandos administrativos ──────────────────────
// Chamadas pelo server.js quando o ponto focal humano envia mensagens
// fromMe que começam com "#".

async function processarComandoHumano(telefone, comando) {
  // Garante que existe sessão para receber a flag
  let sessao = sessoes.get(telefone);
  if (!sessao) sessao = await criarSessao(telefone);

  const cmd = comando.toLowerCase().trim();

  // Atalhos: "#" pausa (igual a #humano); "##" retoma (igual a #bot)
  if (cmd === "#humano" || cmd === "#") {
    sessao.humano_atendendo = true;
    sessao.humano_desde = Date.now();
    console.log(`[Bot] ${cmd}: atendimento humano iniciado para ${telefone}`);
    return true;

  } else if (cmd === "#bot" || cmd === "##") {
    sessao.humano_atendendo = false;
    sessao.humano_desde = null;
    console.log(`[Bot] ${cmd}: bot retomado para ${telefone}`);
    return true;

  } else if (cmd === "#avaliar") {
    sessao.humano_atendendo = false;
    sessao.humano_desde = null;
    sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO_HUMANO;
    console.log(`[Bot] #avaliar: avaliação enviada para ${telefone}`);
    try {
      await enviarMensagem(telefone, MENSAGENS.avaliacao_pos_humano(sessao.primeiro_nome || ""));
    } catch (err) {
      console.error("[Bot] Erro ao enviar avaliação por #avaliar:", err.message);
    }
    return true;
  }

  console.log(`[Bot] Comando não reconhecido: ${comando}`);
  return false;
}

// Atualiza o timestamp de atividade humana (chamado a cada mensagem fromMe
// do ponto focal que não seja um comando #).
function registrarAtividadeHumana(telefone) {
  const sessao = sessoes.get(telefone);
  if (!sessao || !sessao.humano_atendendo) return;
  sessao.humano_desde = Date.now();
}

module.exports = {
  processarMensagem,
  processarComandoHumano,
  registrarAtividadeHumana,
  ESTADOS,
};
