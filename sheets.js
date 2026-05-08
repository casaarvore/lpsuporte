// ═══════════════════════════════════════════════════════════════════════
// MÓDULO: Google Sheets
// Responsável por salvar tickets e ler dados de pontos focais
// ═══════════════════════════════════════════════════════════════════════

const { google } = require("googleapis");
const { CONFIG } = require("./config");

// Autenticação via Service Account (arquivo de credenciais JSON do Google)
function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// ─── Salvar ticket ──────────────────────────────────────────────────────────
async function salvarTicket(ticket) {
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
            "Perfil",
            "Categoria",
            "Resumo da Dúvida",
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
          ticket.perfil,
          ticket.categoria,
          ticket.resumo,
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
}

// ─── Buscar pontos focais (para referência no painel) ──────────────────────
async function buscarPontosFocais() {
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
      escola: row[0] || "",
      municipio: row[1] || "",
      estado: row[2] || "",
      nome_focal: row[3] || "",
      whatsapp: row[4] || "",
      email: row[5] || "",
    }));
  } catch (err) {
    console.error("[Sheets] Erro ao buscar pontos focais:", err.message);
    return [];
  }
}

// ─── Cadastrar ponto focal ──────────────────────────────────────────────────
async function cadastrarPontoFocal(dados) {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Cria cabeçalho se necessário
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
}

// ─── Listar tickets (para o painel web) ────────────────────────────────────
async function listarTickets() {
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
      id: row[0] || "",
      data: row[1] || "",
      hora: row[2] || "",
      nome: row[3] || "",
      telefone: row[4] || "",
      perfil: row[5] || "",
      categoria: row[6] || "",
      resumo: row[7] || "",
      status: row[8] || "Aberto",
    })).reverse(); // mais recentes primeiro
  } catch (err) {
    console.error("[Sheets] Erro ao listar tickets:", err.message);
    return [];
  }
}

module.exports = { salvarTicket, buscarPontosFocais, cadastrarPontoFocal, listarTickets };
