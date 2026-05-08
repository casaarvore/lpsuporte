// ═══════════════════════════════════════════════════════════════════════════
// ARQUIVO DE CONFIGURAÇÃO — LEARNING PASSPORT SUPORTE
// ═══════════════════════════════════════════════════════════════════════════
// Este arquivo pode ser editado pela equipe sem conhecimento de programação.
// Após editar, salve o arquivo e reinicie o servidor no Render.
//
// VERSÃO: 1.1 — alinhada ao Fluxo de Atendimento V0
// Mudanças em relação à versão anterior:
//   • Adicionadas etapas de coleta de telefone e e-mail antes do perfil
//   • Categorias do Gestor atualizadas (removidas RMA e Hub; adicionada Análise)
//   • Categorias agora classificadas como (a) automático ou (b) ticket
//   • Adicionada opção "Voltar ao menu anterior" em todos os menus de perfil
//   • Fluxo pós-resposta automática inclui opção de voltar ao menu
//   • Fluxo pós-ticket: opções de retornar ao início, novo chamado ou encerrar
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {

  // ─── MENSAGENS DO BOT ────────────────────────────────────────────────────
  // Edite os textos que o bot envia para os usuários

  MENSAGENS: {
    boas_vindas:
      `Olá! 👋 Bem-vindo ao suporte do *Passaporte para Aprendizagem* 🌍\n\n`
      + `Sou o assistente virtual do projeto Territórios Conectados.\n\n`
      + `Qual é o seu *nome*?`,

    solicitar_telefone: (nome) =>
      `Obrigado, *${nome}*! 📞\n\n`
      + `Qual é o seu *número de telefone* (com DDD)?\n`
      + `_(Ex: 11 91234-5678)_`,

    solicitar_email: () =>
      `Ótimo! Agora, qual é o seu *e-mail*?\n\n`
      + `_(Digite "pular" se não tiver e-mail)_`,

    selecionar_perfil: () =>
      `Perfeito! Para te ajudar melhor, selecione o seu perfil:\n\n`
      + `1️⃣ Sou *Estudante*\n`
      + `2️⃣ Sou *Educador*\n`
      + `3️⃣ Sou *Gestor* / Ponto Focal`,

    selecionar_categoria: (perfil) =>
      `Entendido! Você é *${perfil}*.\n\nSobre o que precisa de ajuda?\n\n`,

    digitar_duvida:
      `Perfeito! Descreva sua dúvida com o máximo de detalhes possível. 💬`,

    // Exibido após resposta automática (FAQ / IA)
    pos_resposta_automatica:
      `Isso resolveu sua dúvida?\n\n`
      + `1️⃣ ✅ Sim — problema resolvido!\n`
      + `2️⃣ ❌ Não — preciso de mais ajuda (abrir ticket)\n`
      + `3️⃣ 🔙 Voltar ao menu anterior`,

    ticket_aberto: (id) =>
      `✅ Ticket *${id}* registrado com sucesso!\n\n`
      + `Um ponto focal entrará em contato em breve.\n`
      + `Guarde este número para acompanhar sua solicitação.\n\n`
      + `O que deseja fazer agora?\n\n`
      + `1️⃣ 🔄 Retornar ao início\n`
      + `2️⃣ 📋 Abrir novo chamado\n`
      + `3️⃣ 👋 Encerrar`,

    encerramento: (nome) =>
      `Ótimo! Fico feliz em ter ajudado, *${nome}*! 🎉\n\n`
      + `Se precisar de algo, é só chamar. Tenha um ótimo dia!`,

    continuar:
      `Claro! Pode enviar sua próxima dúvida. Estou aqui. 💬`,

    nao_entendido:
      `Desculpe, não entendi. Por favor, responda com o *número* da opção desejada.`,

    erro_tecnico:
      `Ocorreu um erro interno. Por favor, tente novamente em alguns instantes `
      + `ou entre em contato com o suporte pelo e-mail indicado no site.`,
  },

  // ─── PERFIS DE USUÁRIO ───────────────────────────────────────────────────
  // Cada categoria tem um "tipo":
  //   "auto"   → o bot responde via FAQ / IA (caminho a)
  //   "ticket" → o bot abre um chamado diretamente (caminho b)
  //
  // Adicione ou edite perfis e suas categorias conforme necessário.

  PERFIS: {
    "1": {
      nome: "Estudante",
      emoji: "🎓",
      categorias: {
        "1": { label: "Problemas com login ou senha",          tipo: "auto"   },
        "2": { label: "Emitir certificado",                    tipo: "auto"   },
        "3": { label: "Não consigo acessar a plataforma",      tipo: "ticket" },
        "4": { label: "Dúvida sobre um curso ou atividade",    tipo: "ticket" },
        "5": { label: "Outro assunto",                         tipo: "ticket" },
        "6": { label: "Voltar ao menu anterior",               tipo: "voltar" },
      },
    },
    "2": {
      nome: "Educador",
      emoji: "📚",
      categorias: {
        "1": { label: "Problemas com login ou senha",          tipo: "auto"   },
        "2": { label: "Criar ou publicar um curso",            tipo: "auto"   },
        "3": { label: "Não consigo acessar a plataforma",      tipo: "ticket" },
        "4": { label: "Emitir certificado",                    tipo: "ticket" },
        "5": { label: "Outro assunto",                         tipo: "ticket" },
        "6": { label: "Voltar ao menu anterior",               tipo: "voltar" },
      },
    },
    "3": {
      nome: "Gestor / Ponto Focal",
      emoji: "🏫",
      categorias: {
        "1": { label: "Problemas com login ou senha",          tipo: "auto"   },
        "2": { label: "Cadastrar usuários ou escolas",         tipo: "auto"   },
        "3": { label: "Análise e estatísticas da plataforma",  tipo: "auto"   },
        "4": { label: "Outro assunto",                         tipo: "ticket" },
        "5": { label: "Voltar ao menu anterior",               tipo: "voltar" },
      },
    },
  },

  // ─── CONTEXTO PARA A IA ──────────────────────────────────────────────────
  // Este texto é enviado ao Claude para que ele saiba como responder.
  // Edite para adicionar informações específicas do seu projeto.

  CONTEXTO_IA: `Você é o assistente virtual de suporte da plataforma *Learning Passport Brasil*
(brasil.learningpassport.org), um projeto do UNICEF Brasil em parceria com o programa
Territórios Conectados, que atende escolas indígenas, quilombolas e de comunidades
vulneráveis em estados como Roraima, Maranhão, Pernambuco, Rio Grande do Norte e Ceará.

Responda sempre em português brasileiro, de forma clara, acolhedora e objetiva.
Use no máximo 3 parágrafos curtos. Não use markdown complexo — apenas *negrito* e listas simples.

Informações técnicas importantes que você deve conhecer:

ACESSO À PLATAFORMA:
- URL: brasil.learningpassport.org
- Login: por nome de usuário e senha (o login por número de telefone foi descontinuado em outubro/2025)
- Para criar conta: clicar em "Sign up now" na tela de login
- Para recuperar senha: usar o link "Forgot your password?" na tela de login
- Erro "502 Bad Gateway": aguardar 5 minutos e tentar novamente

HUB OFFLINE (dispositivo físico):
- Rede Wi-Fi: nome "LearningPassport", senha "learningpassport"
- Acesso offline: conectar ao Wi-Fi e abrir o endereço fornecido pelo gestor local
- Para administradores: acessar https://10.234.100.1/ em janela anônima
- Luz azul = dispositivo funcionando corretamente
- Se ficar sem uso por semanas: conectar à Internet para reativar

CERTIFICADOS:
- Disponíveis após conclusão de cursos
- Acessados pela área do usuário na plataforma

Se não souber responder, oriente o usuário a acionar o ponto focal local ou
enviar e-mail para o suporte do projeto.`,

  // ─── FAQ — RESPOSTAS AUTOMÁTICAS ─────────────────────────────────────────
  // Se a dúvida do usuário contiver as palavras-chave abaixo,
  // o bot responde diretamente sem chamar a IA (mais rápido e econômico).
  // Deixe o array de keywords vazio [] para desativar uma entrada.

  FAQ: [
    {
      keywords: ["senha", "password", "esqueci", "recuperar", "login"],
      resposta:
        `🔑 *Recuperação de senha:*\n\n`
        + `1. Acesse brasil.learningpassport.org\n`
        + `2. Clique em "Iniciar sessão"\n`
        + `3. Clique em *"Forgot your password?"*\n`
        + `4. Digite seu e-mail ou nome de usuário\n`
        + `5. Verifique sua caixa de entrada (e a pasta de spam)\n\n`
        + `Se não lembrar o nome de usuário, contacte o gestor da sua escola.`,
    },
    {
      keywords: ["certificado", "certificate", "concluí", "concluiu", "terminou"],
      resposta:
        `🏆 *Para emitir seu certificado:*\n\n`
        + `1. Acesse brasil.learningpassport.org e faça login\n`
        + `2. Vá até o curso concluído no seu perfil\n`
        + `3. Clique em "Ver certificado" ou "Download"\n\n`
        + `O certificado só aparece após 100% de conclusão do curso.`,
    },
    {
      keywords: ["502", "bad gateway", "erro", "não abre", "não carrega"],
      resposta:
        `⚠️ *Erro 502 Bad Gateway:*\n\n`
        + `Isso acontece quando a plataforma está reiniciando. É temporário.\n\n`
        + `✔️ Aguarde *5 minutos* e tente novamente.\n`
        + `✔️ Se persistir, verifique se está conectado à rede correta\n`
        + `(Wi-Fi "LearningPassport" para modo offline).`,
    },
    {
      keywords: ["wifi", "wi-fi", "rede", "conectar", "hub", "offline"],
      resposta:
        `📶 *Conectar ao Hub Offline:*\n\n`
        + `1. Abra as configurações de Wi-Fi do seu dispositivo\n`
        + `2. Selecione a rede: *LearningPassport*\n`
        + `3. Senha: *learningpassport* (tudo minúsculo, sem espaços)\n`
        + `4. Abra o navegador e acesse o endereço informado pelo gestor\n\n`
        + `A luz azul no dispositivo indica que está funcionando.`,
    },
    {
      keywords: ["cadastrar", "cadastro", "usuário", "escola", "criar conta"],
      resposta:
        `👤 *Cadastrar usuários ou escolas:*\n\n`
        + `1. Acesse brasil.learningpassport.org com sua conta de Gestor\n`
        + `2. Vá em *Administração* → *Usuários* → *Adicionar usuário*\n`
        + `3. Preencha os dados e defina o perfil (Estudante / Educador)\n`
        + `4. Clique em *Salvar*\n\n`
        + `Para cadastrar uma escola, acesse *Administração* → *Organizações*.`,
    },
    {
      keywords: ["estatística", "estatísticas", "relatório", "análise", "dados", "progresso"],
      resposta:
        `📊 *Análise e estatísticas:*\n\n`
        + `1. Acesse brasil.learningpassport.org com sua conta de Gestor\n`
        + `2. Vá em *Administração* → *Relatórios*\n`
        + `3. Filtre por escola, turma ou período desejado\n`
        + `4. Exporte em CSV ou visualize na tela\n\n`
        + `Os dados são atualizados em tempo real conforme os alunos concluem atividades.`,
    },
  ],

  // ─── CONFIGURAÇÕES GERAIS ────────────────────────────────────────────────

  CONFIG: {
    // Após quantos minutos sem resposta o bot encerra a sessão
    timeout_sessao_minutos: 30,

    // Número máximo de mensagens por sessão antes de sugerir ticket
    max_mensagens_antes_ticket: 6,

    // Texto do rodapé nos tickets registrados no Google Sheets
    rodape_ticket: "Gerado automaticamente pelo bot de suporte — Learning Passport Brasil",

    // Nome da aba no Google Sheets onde os tickets serão salvos
    aba_tickets: "Tickets",

    // Nome da aba no Google Sheets para cadastro de pontos focais
    aba_pontos_focais: "Pontos_Focais",

    // Colunas salvas no Google Sheets para cada ticket
    // (ordem das colunas na planilha)
    colunas_ticket: ["id", "data", "nome", "telefone", "email", "perfil", "categoria", "duvida", "status"],
  },
};
