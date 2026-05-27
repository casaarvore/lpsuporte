// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Google Sheets
// Responsável por salvar tickets, atendimentos, usuários e ler dados de
// pontos focais.
//
// Versão 3.1:
//   • Novo: buscarUsuario e salvarUsuario para a nova aba Usuarios
//   • Tickets ampliados com colunas Município/Estado e Escola (A:K)
//   • Atendimentos ampliados com coluna Escola (A:K)
//   • Mantém o salvarAtendimento e listarAtendimentos da v3.0
//   • Rate limiting mantido: fila serializada + 600ms entre chamadas
// ═══════════════════════════════════════════════════════════════════════

const { google } = require("googleapis");
const { CONFIG } = require("./config");

// ─── Rate Limiting — fila serializada ─────────────────────────────────────
// Todas as chamadas à Sheets API passam por esta fila.
// Garante no máximo 1 chamada a cada 600ms, evitando bloqueios por excesso
// de requisições (limite gratuito: 60 req/min por projeto).

const DELAY_MS = 600;
let filaPromise = Promise.resolve();

function enfileirar(fn) {
  filaPromise = filaPromise
    .then(() => new Promise((res) => setTimeout(res, DELAY_MS)))
    .then(fn);
  return filaPromise;
}

// ─── Autenticação via Service Account ─────────────────────────────────────
function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// ─── Salvar ticket ──────────────────────────────────────────────────────────
async function salvarTicket(ticket) {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      // Verifica se o cabeçalho existe; se não, cria
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_tickets}!A1:K1`,
      });

      if (!res.data.values || res.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${CONFIG.aba_tickets}!A1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              "ID do Ticket",
              "Data",
              "Hora",
              "Nome do Usuário",
              "Telefone",
              "E-mail",
              "Perfil",
              "Município/Estado",
              "Escola/Secretaria",
              "Dúvida",
              "Status",
            ]],
          },
        });
      }

      // Adiciona o ticket como nova linha
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG.aba_tickets}!A:K`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            ticket.id,
            ticket.data,
            ticket.hora,
            ticket.nome,
            ticket.telefone,
            ticket.email || "",
            ticket.perfil,
            ticket.municipio_estado || "",
            ticket.escola || "",
            ticket.duvida,
            "Aberto",
          ]],
        },
      });

      console.log(`[Sheets] Ticket ${ticket.id} salvo com sucesso.`);
      return true;
    } catch (err) {
      console.error("[Sheets] Erro ao salvar ticket:", err.message);
      return false;
    }
  });
}

// ─── Salvar atendimento (todos os contatos, resolvidos ou não) ─────────────
// Gera um registro na aba Atendimentos para fins estatísticos. Telefone é
// guardado, mas não há nome (consideramos "anônimo" em relação à identificação
// nominal). Inclui e-mail e município/estado quando disponíveis.
async function salvarAtendimento(atendimento) {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_atendimentos}!A1:K1`,
      });

      if (!res.data.values || res.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${CONFIG.aba_atendimentos}!A1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              "Data",
              "Hora",
              "Telefone",
              "Perfil",
              "Dúvida",
              "Resposta",
              "Origem da Resposta",
              "E-mail",
              "Município/Estado",
              "Escola/Secretaria",
              "Virou Ticket?",
            ]],
          },
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG.aba_atendimentos}!A:K`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            atendimento.data,
            atendimento.hora,
            atendimento.telefone,
            atendimento.perfil || "",
            atendimento.duvida || "",
            atendimento.resposta || "",
            atendimento.origem || "",
            atendimento.email || "",
            atendimento.municipio_estado || "",
            atendimento.escola || "",
            atendimento.virou_ticket || "Não",
          ]],
        },
      });

      console.log(`[Sheets] Atendimento de ${atendimento.telefone} registrado.`);
      return true;
    } catch (err) {
      console.error("[Sheets] Erro ao salvar atendimento:", err.message);
      return false;
    }
  });
}

// ─── Listar atendimentos (para painel ou exportação) ──────────────────────
async function listarAtendimentos() {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_atendimentos}!A:K`,
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) return [];

      const [, ...data] = rows;
      return data.map((row) => ({
        data:             row[0] || "",
        hora:             row[1] || "",
        telefone:         row[2] || "",
        perfil:           row[3] || "",
        duvida:           row[4] || "",
        resposta:         row[5] || "",
        origem:           row[6] || "",
        email:            row[7] || "",
        municipio_estado: row[8] || "",
        escola:           row[9] || "",
        virou_ticket:     row[10] || "Não",
      })).reverse();
    } catch (err) {
      console.error("[Sheets] Erro ao listar atendimentos:", err.message);
      return [];
    }
  });
}

// ─── Buscar usuário pelo telefone (reconhecimento de recorrentes) ────────
// Retorna os dados gravados ou null se o telefone não estiver na aba.
async function buscarUsuario(telefone) {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_usuarios}!A:J`,
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) return null;

      // Pula o cabeçalho e procura pelo telefone na coluna A
      const row = rows.slice(1).find((r) => (r[0] || "").trim() === telefone);
      if (!row) return null;

      return {
        telefone:           row[0] || "",
        nome_completo:      row[1] || "",
        primeiro_nome:      row[2] || "",
        perfil_id:          row[3] || "",
        perfil_nome:        row[4] || "",
        municipio_estado:   row[5] || "",
        escola:             row[6] || "",
        email:              row[7] || "",
        primeira_interacao: row[8] || "",
        ultima_interacao:   row[9] || "",
      };
    } catch (err) {
      console.error("[Sheets] Erro ao buscar usuário:", err.message);
      return null;
    }
  });
}

// ─── Salvar usuário (apenas insere se o telefone for novo) ───────────────
// Conforme decisão de design (versão A), usuários recorrentes mantêm os
// dados originais; alterações exigem intervenção administrativa via ticket.
async function salvarUsuario(usuario) {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_usuarios}!A:J`,
      });

      const rows = res.data.values || [];

      // Cria cabeçalho se necessário
      if (rows.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${CONFIG.aba_usuarios}!A1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[
              "Telefone",
              "Nome Completo",
              "Primeiro Nome",
              "Perfil ID",
              "Perfil",
              "Município/Estado",
              "Escola/Secretaria",
              "E-mail",
              "Primeira Interação",
              "Última Interação",
            ]],
          },
        });
      }

      // Se telefone já existe, não sobrescreve
      const existe = rows.slice(1).some((r) => (r[0] || "").trim() === usuario.telefone);
      if (existe) {
        console.log(`[Sheets] Usuário ${usuario.telefone} já cadastrado; não atualiza.`);
        return true;
      }

      const agora = new Date().toLocaleString("pt-BR");
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG.aba_usuarios}!A:J`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            usuario.telefone,
            usuario.nome_completo || "",
            usuario.primeiro_nome || "",
            usuario.perfil_id || "",
            usuario.perfil_nome || "",
            usuario.municipio_estado || "",
            usuario.escola || "",
            usuario.email || "",
            agora,
            agora,
          ]],
        },
      });

      console.log(`[Sheets] Usuário ${usuario.telefone} cadastrado.`);
      return true;
    } catch (err) {
      console.error("[Sheets] Erro ao salvar usuário:", err.message);
      return false;
    }
  });
}

// ─── Buscar pontos focais (para referência no painel) ──────────────────────
async function buscarPontosFocais() {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_pontos_focais}!A:F`,
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) return [];

      const [header, ...data] = rows;
      return data.map((row) => ({
        escola:     row[0] || "",
        municipio:  row[1] || "",
        estado:     row[2] || "",
        nome_focal: row[3] || "",
        whatsapp:   row[4] || "",
        email:      row[5] || "",
      }));
    } catch (err) {
      console.error("[Sheets] Erro ao buscar pontos focais:", err.message);
      return [];
    }
  });
}

// ─── Cadastrar ponto focal ──────────────────────────────────────────────────
async function cadastrarPontoFocal(dados) {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_pontos_focais}!A1:F1`,
      });

      if (!res.data.values || res.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${CONFIG.aba_pontos_focais}!A1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [["Escola/Secretaria", "Município", "Estado", "Nome do Ponto Focal", "WhatsApp", "E-mail"]],
          },
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG.aba_pontos_focais}!A:F`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            dados.escola,
            dados.municipio,
            dados.estado,
            dados.nome_focal,
            dados.whatsapp,
            dados.email,
          ]],
        },
      });

      return true;
    } catch (err) {
      console.error("[Sheets] Erro ao cadastrar ponto focal:", err.message);
      return false;
    }
  });
}

// ─── Listar tickets (para o painel web) ────────────────────────────────────
async function listarTickets() {
  return enfileirar(async () => {
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CONFIG.aba_tickets}!A:K`,
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) return [];

      const [, ...data] = rows;
      return data.map((row) => ({
        id:               row[0] || "",
        data:             row[1] || "",
        hora:             row[2] || "",
        nome:             row[3] || "",
        telefone:         row[4] || "",
        email:            row[5] || "",
        perfil:           row[6] || "",
        municipio_estado: row[7] || "",
        escola:           row[8] || "",
        duvida:           row[9] || "",
        status:           row[10] || "Aberto",
      })).reverse();
    } catch (err) {
      console.error("[Sheets] Erro ao listar tickets:", err.message);
      return [];
    }
  });
}

module.exports = {
  salvarTicket,
  buscarPontosFocais,
  cadastrarPontoFocal,
  listarTickets,
  salvarAtendimento,
  listarAtendimentos,
  buscarUsuario,
  salvarUsuario,
};
