// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Bot — Gerenciamento de sessões e fluxo de conversa
// Versão: 2.0 — alinhada ao Fluxo de Atendimento V0
//
// Mudanças em relação à versão anterior:
//   • Adicionadas etapas AGUARDANDO_TELEFONE e AGUARDANDO_EMAIL
//   • Categorias agora têm tipo "auto", "ticket" ou "voltar"
//   • Caminho (a) automático: FAQ/IA → pergunta se resolveu → 3 opções
//   • Caminho (b) ticket: abre chamado direto → mostra número → 3 opções
//   • Opção "Voltar ao menu anterior" implementada em todos os menus
//   • Pós-ticket: 1=retornar ao início / 2=novo chamado / 3=encerrar
//   • Pós-resposta automática: 1=encerrar / 2=abrir ticket / 3=voltar menu
// ═══════════════════════════════════════════════════════════════════════

const { MENSAGENS, PERFIS, CONFIG } = require("./config");
const { gerarResposta } = require("./claude");
const { salvarTicket } = require("./sheets");

// ─── Armazenamento de sessões em memória ──────────────────────────────────
const sessoes = new Map();

// ─── Estados possíveis da conversa ────────────────────────────────────────
const ESTADOS = {
  AGUARDANDO_NOME:       "aguardando_nome",
  AGUARDANDO_TELEFONE:   "aguardando_telefone",
  AGUARDANDO_EMAIL:      "aguardando_email",
  AGUARDANDO_PERFIL:     "aguardando_perfil",
  AGUARDANDO_CATEGORIA:  "aguardando_categoria",
  AGUARDANDO_DUVIDA:     "aguardando_duvida",
  AGUARDANDO_AVALIACAO:  "aguardando_avaliacao",   // pós resposta automática
  AGUARDANDO_POS_TICKET: "aguardando_pos_ticket",  // pós abertura de ticket
  ENCERRADO:             "encerrado",
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
    telefone,
    estado: ESTADOS.AGUARDANDO_NOME,
    nome: null,
    telefone_contato: null,
    email: null,
    perfil_id: null,
    perfil_nome: null,
    categoria_id: null,
    categoria_nome: null,
    categoria_tipo: null,   // "auto" | "ticket" | "voltar"
    historico: [],
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

// ─── Montar menu de categorias ─────────────────────────────────────────────
function montarMenuCategorias(perfil_id) {
  const perfil = PERFIS[perfil_id];
  if (!perfil) return "";
  let menu = "";
  for (const [num, cat] of Object.entries(perfil.categorias)) {
    menu += `${num}️⃣ ${cat.label}\n`;
  }
  return menu;
}

// ─── Abrir ticket direto (caminho b) ──────────────────────────────────────
async function abrirTicket(sessao, telefone, duvida) {
  const ticketId = gerarIdTicket();
  const agora = new Date();

  const ticket = {
    id:        ticketId,
    data:      agora.toLocaleDateString("pt-BR"),
    hora:      agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    nome:      sessao.nome,
    telefone:  sessao.telefone_contato || telefone,
    email:     sessao.email || "",
    perfil:    sessao.perfil_nome,
    categoria: sessao.categoria_nome,
    duvida:    duvida.slice(0, 200),
  };

  await salvarTicket(ticket);
  return ticketId;
}

// ─── Processar mensagem recebida ──────────────────────────────────────────
async function processarMensagem(telefone, textoRecebido) {
  const sessao = obterSessao(telefone);
  const texto  = textoRecebido.trim();
  sessao.contagem_mensagens++;

  let resposta = null;

  // ── ESTADO: aguardando nome ────────────────────────────────────────────
  if (sessao.estado === ESTADOS.AGUARDANDO_NOME) {
    sessao.nome   = texto.split(" ")[0];
    sessao.estado = ESTADOS.AGUARDANDO_TELEFONE;
    resposta = MENSAGENS.solicitar_telefone(sessao.nome);
  }

  // ── ESTADO: aguardando telefone de contato ────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_TELEFONE) {
    sessao.telefone_contato = texto;
    sessao.estado = ESTADOS.AGUARDANDO_EMAIL;
    resposta = MENSAGENS.solicitar_email();
  }

  // ── ESTADO: aguardando e-mail ─────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_EMAIL) {
    sessao.email  = texto.toLowerCase() === "pular" ? "" : texto;
    sessao.estado = ESTADOS.AGUARDANDO_PERFIL;
    resposta = MENSAGENS.selecionar_perfil();
  }

  // ── ESTADO: aguardando perfil ─────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_PERFIL) {
    if (!PERFIS[texto]) {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.selecionar_perfil();
    } else {
      sessao.perfil_id   = texto;
      sessao.perfil_nome = `${PERFIS[texto].emoji} ${PERFIS[texto].nome}`;
      sessao.estado      = ESTADOS.AGUARDANDO_CATEGORIA;
      resposta = MENSAGENS.selecionar_categoria(sessao.perfil_nome)
               + montarMenuCategorias(sessao.perfil_id);
    }
  }

  // ── ESTADO: aguardando categoria ──────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_CATEGORIA) {
    const categorias = PERFIS[sessao.perfil_id]?.categorias || {};
    const cat        = categorias[texto];

    if (!cat) {
      resposta = MENSAGENS.nao_entendido + "\n\n"
               + MENSAGENS.selecionar_categoria(sessao.perfil_nome)
               + montarMenuCategorias(sessao.perfil_id);

    } else if (cat.tipo === "voltar") {
      // Volta ao menu de perfil
      sessao.estado = ESTADOS.AGUARDANDO_PERFIL;
      resposta = MENSAGENS.selecionar_perfil();

    } else {
      sessao.categoria_id   = texto;
      sessao.categoria_nome = cat.label;
      sessao.categoria_tipo = cat.tipo;
      sessao.estado         = ESTADOS.AGUARDANDO_DUVIDA;
      resposta = MENSAGENS.digitar_duvida;
    }
  }

  // ── ESTADO: aguardando dúvida ─────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_DUVIDA) {
    const duvida = texto;

    // ── CAMINHO (b): abre ticket direto ──────────────────────────────
    if (sessao.categoria_tipo === "ticket") {
      const ticketId = await abrirTicket(sessao, telefone, duvida);
      sessao.estado  = ESTADOS.AGUARDANDO_POS_TICKET;
      resposta = MENSAGENS.ticket_aberto(ticketId);

    // ── CAMINHO (a): resposta automática via FAQ / IA ─────────────────
    } else {
      sessao.historico.push({ de: "usuario", texto: duvida });

      const ia = await gerarResposta({
        perfil:        sessao.perfil_nome,
        categoria:     sessao.categoria_nome,
        historico:     sessao.historico.slice(0, -1),
        mensagemAtual: duvida,
      });

      if (!ia) {
        resposta = MENSAGENS.erro_tecnico;
      } else {
        sessao.historico.push({ de: "bot", texto: ia });
        sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
        resposta = ia + "\n\n──────────\n" + MENSAGENS.pos_resposta_automatica;
      }
    }
  }

  // ── ESTADO: aguardando avaliação da resposta automática (caminho a) ──
  else if (sessao.estado === ESTADOS.AGUARDANDO_AVALIACAO) {

    if (texto === "1") {
      // Encerrar — resolvido
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.nome);
      sessoes.delete(telefone);

    } else if (texto === "2") {
      // Abrir ticket
      const ultimaDuvida = [...sessao.historico]
        .reverse()
        .find((m) => m.de === "usuario")?.texto || "Sem descrição";

      const ticketId = await abrirTicket(sessao, telefone, ultimaDuvida);
      sessao.estado  = ESTADOS.AGUARDANDO_POS_TICKET;
      resposta = MENSAGENS.ticket_aberto(ticketId);

    } else if (texto === "3") {
      // Voltar ao menu de categorias
      sessao.estado = ESTADOS.AGUARDANDO_CATEGORIA;
      resposta = MENSAGENS.selecionar_categoria(sessao.perfil_nome)
               + montarMenuCategorias(sessao.perfil_id);

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.pos_resposta_automatica;
    }
  }

  // ── ESTADO: aguardando escolha pós-ticket (caminho b e "não resolvido") ─
  else if (sessao.estado === ESTADOS.AGUARDANDO_POS_TICKET) {

    if (texto === "1") {
      // Retornar ao início — reinicia sessão mantendo dados do usuário
      sessao.estado         = ESTADOS.AGUARDANDO_PERFIL;
      sessao.categoria_id   = null;
      sessao.categoria_nome = null;
      sessao.categoria_tipo = null;
      sessao.historico      = [];
      resposta = MENSAGENS.selecionar_perfil();

    } else if (texto === "2") {
      // Abrir novo chamado — volta à seleção de categoria
      sessao.estado         = ESTADOS.AGUARDANDO_CATEGORIA;
      sessao.categoria_id   = null;
      sessao.categoria_nome = null;
      sessao.categoria_tipo = null;
      sessao.historico      = [];
      resposta = MENSAGENS.selecionar_categoria(sessao.perfil_nome)
               + montarMenuCategorias(sessao.perfil_id);

    } else if (texto === "3") {
      // Encerrar
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.nome);
      sessoes.delete(telefone);

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.ticket_aberto_opcoes();
    }
  }

  // ── ESTADO: encerrado — qualquer mensagem reinicia ────────────────────
  else {
    sessoes.delete(telefone);
    criarSessao(telefone);
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
