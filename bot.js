// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Bot — Gerenciamento de sessões e fluxo de conversa
// ═══════════════════════════════════════════════════════════════════════

const { MENSAGENS, PERFIS, CONFIG } = require("./config");
const { gerarResposta } = require("./claude");
const { salvarTicket } = require("./sheets");

// ─── Armazenamento de sessões em memória ───────────────────────────────────
// Cada chave é o número de telefone do usuário
const sessoes = new Map();

// Estados possíveis da conversa
const ESTADOS = {
  AGUARDANDO_NOME: "aguardando_nome",
  AGUARDANDO_PERFIL: "aguardando_perfil",
  AGUARDANDO_CATEGORIA: "aguardando_categoria",
  AGUARDANDO_DUVIDA: "aguardando_duvida",
  EM_ATENDIMENTO: "em_atendimento",
  AGUARDANDO_AVALIACAO: "aguardando_avaliacao",
  ENCERRADO: "encerrado",
};

// ─── Gerador de ID de ticket ───────────────────────────────────────────────
function gerarIdTicket() {
  const data = new Date();
  const prefixo = "LP";
  const ano = data.getFullYear().toString().slice(-2);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefixo}-${ano}${mes}${dia}-${rand}`;
}

// ─── Criar nova sessão ─────────────────────────────────────────────────────
function criarSessao(telefone) {
  const sessao = {
    telefone,
    estado: ESTADOS.AGUARDANDO_NOME,
    nome: null,
    perfil_id: null,
    perfil_nome: null,
    categoria_id: null,
    categoria_nome: null,
    historico: [], // { de: "usuario"|"bot", texto: "..." }
    criada_em: Date.now(),
    ultima_atividade: Date.now(),
    contagem_mensagens: 0,
  };
  sessoes.set(telefone, sessao);
  return sessao;
}

// ─── Obter ou criar sessão ────────────────────────────────────────────────
function obterSessao(telefone) {
  let sessao = sessoes.get(telefone);

  if (!sessao) return criarSessao(telefone);

  // Verifica timeout de inatividade
  const inatividade = (Date.now() - sessao.ultima_atividade) / 1000 / 60;
  if (inatividade > CONFIG.timeout_sessao_minutos) {
    sessoes.delete(telefone);
    return criarSessao(telefone);
  }

  sessao.ultima_atividade = Date.now();
  return sessao;
}

// ─── Montar menu de categorias ────────────────────────────────────────────
function montarMenuCategorias(perfil_id) {
  const perfil = PERFIS[perfil_id];
  if (!perfil) return "";
  let menu = "";
  for (const [num, label] of Object.entries(perfil.categorias)) {
    menu += `${num}️⃣ ${label}\n`;
  }
  return menu;
}

// ─── Processar mensagem recebida ──────────────────────────────────────────
async function processarMensagem(telefone, textoRecebido) {
  const sessao = obterSessao(telefone);
  const texto = textoRecebido.trim();
  sessao.contagem_mensagens++;

  let resposta = null;

  // ── ESTADO: aguardando nome ────────────────────────────────────────────
  if (sessao.estado === ESTADOS.AGUARDANDO_NOME) {
    sessao.nome = texto.split(" ")[0]; // pega apenas o primeiro nome
    sessao.estado = ESTADOS.AGUARDANDO_PERFIL;
    resposta = MENSAGENS.selecionar_perfil(sessao.nome);
  }

  // ── ESTADO: aguardando perfil ──────────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_PERFIL) {
    if (!PERFIS[texto]) {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.selecionar_perfil(sessao.nome);
    } else {
      sessao.perfil_id = texto;
      sessao.perfil_nome = `${PERFIS[texto].emoji} ${PERFIS[texto].nome}`;
      sessao.estado = ESTADOS.AGUARDANDO_CATEGORIA;
      resposta = MENSAGENS.selecionar_categoria(sessao.perfil_nome)
        + montarMenuCategorias(sessao.perfil_id);
    }
  }

  // ── ESTADO: aguardando categoria ───────────────────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_CATEGORIA) {
    const categorias = PERFIS[sessao.perfil_id]?.categorias || {};
    if (!categorias[texto]) {
      resposta = MENSAGENS.nao_entendido + "\n\n" + montarMenuCategorias(sessao.perfil_id);
    } else {
      sessao.categoria_id = texto;
      sessao.categoria_nome = categorias[texto];
      sessao.estado = ESTADOS.AGUARDANDO_DUVIDA;
      resposta = MENSAGENS.digitar_duvida;
    }
  }

  // ── ESTADO: aguardando dúvida (primeira mensagem de conteúdo) ──────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_DUVIDA) {
    sessao.historico.push({ de: "usuario", texto });
    sessao.estado = ESTADOS.EM_ATENDIMENTO;

    const ia = await gerarResposta({
      perfil: sessao.perfil_nome,
      categoria: sessao.categoria_nome,
      historico: sessao.historico.slice(0, -1),
      mensagemAtual: texto,
    });

    if (!ia) {
      resposta = MENSAGENS.erro_tecnico;
    } else {
      sessao.historico.push({ de: "bot", texto: ia });
      resposta = ia + "\n\n──────────\n" + MENSAGENS.pos_resposta;
      sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
    }
  }

  // ── ESTADO: em atendimento (continuação de conversa) ───────────────────
  else if (sessao.estado === ESTADOS.EM_ATENDIMENTO) {
    sessao.historico.push({ de: "usuario", texto });

    // Sugerir ticket após muitas mensagens
    if (sessao.contagem_mensagens >= CONFIG.max_mensagens_antes_ticket) {
      sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
      resposta = "Já conversamos bastante! 😊\n\n" + MENSAGENS.pos_resposta;
    } else {
      const ia = await gerarResposta({
        perfil: sessao.perfil_nome,
        categoria: sessao.categoria_nome,
        historico: sessao.historico.slice(0, -1),
        mensagemAtual: texto,
      });

      if (!ia) {
        resposta = MENSAGENS.erro_tecnico;
      } else {
        sessao.historico.push({ de: "bot", texto: ia });
        resposta = ia + "\n\n──────────\n" + MENSAGENS.pos_resposta;
        sessao.estado = ESTADOS.AGUARDANDO_AVALIACAO;
      }
    }
  }

  // ── ESTADO: aguardando avaliação pós-resposta ──────────────────────────
  else if (sessao.estado === ESTADOS.AGUARDANDO_AVALIACAO) {
    if (texto === "1") {
      // Resolvido
      sessao.estado = ESTADOS.ENCERRADO;
      resposta = MENSAGENS.encerramento(sessao.nome);
      sessoes.delete(telefone); // limpa sessão

    } else if (texto === "2") {
      // Continuar
      sessao.estado = ESTADOS.EM_ATENDIMENTO;
      resposta = MENSAGENS.continuar;

    } else if (texto === "3") {
      // Registrar ticket
      const ticketId = gerarIdTicket();
      const agora = new Date();
      const ultimaDuvida = [...sessao.historico]
        .reverse()
        .find((m) => m.de === "usuario")?.texto || "Sem descrição";

      const ticket = {
        id: ticketId,
        data: agora.toLocaleDateString("pt-BR"),
        hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        nome: sessao.nome,
        telefone,
        perfil: sessao.perfil_nome,
        categoria: sessao.categoria_nome,
        resumo: ultimaDuvida.slice(0, 200),
      };

      const salvo = await salvarTicket(ticket);

      resposta = salvo
        ? MENSAGENS.ticket_aberto(ticketId)
        : `✅ Ticket *${ticketId}* anotado!\n(Houve uma instabilidade ao salvar, mas o ponto focal foi notificado.)`;

      sessao.estado = ESTADOS.ENCERRADO;
      sessoes.delete(telefone);

    } else {
      resposta = MENSAGENS.nao_entendido + "\n\n" + MENSAGENS.pos_resposta;
    }
  }

  // ── ESTADO: encerrado (reiniciar) ──────────────────────────────────────
  else {
    sessoes.delete(telefone);
    const nova = criarSessao(telefone);
    resposta = MENSAGENS.boas_vindas;
  }

  return resposta || MENSAGENS.erro_tecnico;
}

// ─── Limpar sessões expiradas (executar periodicamente) ────────────────────
function limparSessoesExpiradas() {
  const agora = Date.now();
  for (const [tel, sessao] of sessoes.entries()) {
    const minutos = (agora - sessao.ultima_atividade) / 1000 / 60;
    if (minutos > CONFIG.timeout_sessao_minutos) {
      sessoes.delete(tel);
    }
  }
}

// Limpa sessões expiradas a cada 10 minutos
setInterval(limparSessoesExpiradas, 10 * 60 * 1000);

module.exports = { processarMensagem, ESTADOS };
