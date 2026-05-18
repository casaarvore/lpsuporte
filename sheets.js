// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Google Sheets
// Responsável por salvar tickets, atendimentos e ler dados de pontos focais
//
// Versão 3.0:
//   • Novo: salvarAtendimento e listarAtendimentos para a aba Atendimentos
//   • Tickets agora têm 9 colunas (sem categoria, removida na v3.0 do bot)
//   • Range de tickets: A:I (era A:J)
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
        range: `${CONFIG.aba_tickets}!A1:I1`,
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
              "Dúvida",
              "Status",
            ]],
          },
        });
      }

      // Adiciona o ticket como nova linha
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG.aba_tickets}!A:I`,
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
        range: `${CONFIG.aba_atendimentos}!A1:J1`,
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
              "Virou Ticket?",
            ]],
          },
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG.aba_atendimentos}!A:J`,
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
        range: `${CONFIG.aba_atendimentos}!A:J`,
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
        virou_ticket:     row[9] || "Não",
      })).reverse();
    } catch (err) {
      console.error("[Sheets] Erro ao listar atendimentos:", err.message);
      return [];
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
        range: `${CONFIG.aba_tickets}!A:I`,
      });

      const rows = res.data.values || [];
      if (rows.length <= 1) return [];

      const [, ...data] = rows;
      return data.map((row) => ({
        id:        row[0] || "",
        data:      row[1] || "",
        hora:      row[2] || "",
        nome:      row[3] || "",
        telefone:  row[4] || "",
        email:     row[5] || "",
        perfil:    row[6] || "",
        duvida:    row[7] || "",
        status:    row[8] || "Aberto",
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
};
