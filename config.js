// ═══════════════════════════════════════════════════════════════════════════
// ARQUIVO DE CONFIGURAÇÃO — LEARNING PASSPORT SUPORTE
// ═══════════════════════════════════════════════════════════════════════════
// Este arquivo pode ser editado pela equipe sem conhecimento de programação.
// Após editar, salve o arquivo no GitHub — o Render atualizará em ~1 minuto.
//
// VERSÃO: 2.1 — indexa a base de conhecimento knowledge.js
//   • Importa REFERENCIAS, KNOWLEDGE, FAQ_GESTORES e CONTEXTO_GESTORES
//   • FAQ_GESTORES é concatenada ao FAQ principal (spread no final do array)
//   • CONTEXTO_GESTORES é anexado ao CONTEXTO_IA usado pelo prompt da IA
// ═══════════════════════════════════════════════════════════════════════════

const knowledge = require("./knowledge");

module.exports = {

  // ─── MENSAGENS DO BOT ────────────────────────────────────────────────────

  MENSAGENS: {
    boas_vindas:
      `Olá! 👋 Bem-vindo ao suporte do *Passaporte para Aprendizagem (Learning Passport)* 🌍\n\n`
      + `Sou o assistente virtual do projeto Territórios Conectados.\n\n`
      + `Qual é o seu *nome*?`,

    solicitar_telefone: (nome) =>
      `Obrigado, *${nome}*! 📞\n\n`
      + `Qual é o seu *número de telefone* com DDD?\n`
      + `_(Ex: 11 91234-5678)_`,

    solicitar_email: () =>
      `Ótimo! Agora, qual é o seu *e-mail*?\n\n`
      + `_(Digite "pular" se não tiver e-mail)_`,

    selecionar_perfil: () =>
      `Perfeito! Para te ajudar melhor, selecione o seu perfil:\n\n`
      + `1️⃣ Sou *Estudante*\n`
      + `2️⃣ Sou *Educador*\n`
      + `3️⃣ Sou *Gestor* / Ponto Focal\n`
      + `4️⃣ 🔙 Voltar ao início`,

    selecionar_categoria: (perfil) =>
      `Entendido! Você é *${perfil}*.\n\nSobre o que precisa de ajuda?\n\n`,

    digitar_duvida:
      `Perfeito! Descreva sua dúvida com o máximo de detalhes possível. 💬`,

    // Exibido após resposta automática (FAQ / IA) — caminho (a)
    pos_resposta_automatica:
      `Isso resolveu sua dúvida?\n\n`
      + `1️⃣ ✅ Sim — problema resolvido!\n`
      + `2️⃣ ❌ Não — abrir ticket para atendimento humano\n`
      + `3️⃣ 🔙 Voltar ao menu anterior`,

    // Exibido após ticket registrado — caminho (b)
    ticket_aberto: (id) =>
      `✅ Ticket *${id}* registrado com sucesso!\n\n`
      + `🕒 *Prazo de retorno:* até *24 horas* em dias úteis.\n`
      + `_(Em feriados ou finais de semana, o atendimento pode ocorrer no próximo dia útil.)_\n\n`
      + `📞 *Como você será contatado:* o ponto focal responderá pelo *próprio WhatsApp* `
      + `usado nesta conversa ou pelo *e-mail cadastrado na plataforma*.\n\n`
      + `📌 Guarde o número *${id}* para acompanhar sua solicitação. `
      + `Caso precise complementar a dúvida, basta responder mencionando esse número.\n\n`
      + `O que deseja fazer agora?\n\n`
      + `1️⃣ 🔄 Retornar ao início\n`
      + `2️⃣ 📋 Abrir novo chamado\n`
      + `3️⃣ 👋 Encerrar`,

    // Reenvia as opções pós-ticket se o usuário digitar algo inválido
    ticket_aberto_opcoes: () =>
      `O que deseja fazer agora?\n\n`
      + `1️⃣ 🔄 Retornar ao início\n`
      + `2️⃣ 📋 Abrir novo chamado\n`
      + `3️⃣ 👋 Encerrar`,

    encerramento: (nome) =>
      `Ótimo! Fico feliz em ter ajudado, *${nome}*! 🎉\n\n`
      + `Se precisar de algo, é só chamar. Tenha um ótimo dia!`,

    nao_entendido:
      `Desculpe, não entendi. Por favor, responda com o *número* da opção desejada.`,

    erro_tecnico:
      `Ocorreu um erro interno. Por favor, tente novamente em alguns instantes `
      + `ou entre em contato com o suporte pelo e-mail indicado no site.`,
  },

  // ─── PERFIS DE USUÁRIO ───────────────────────────────────────────────────
  // tipo "auto"   → resposta via FAQ / IA (caminho a)
  // tipo "ticket" → abre chamado direto (caminho b)
  // tipo "voltar" → volta ao menu de perfil

  PERFIS: {
    "1": {
      nome: "Estudante",
      emoji: "🎓",
      categorias: {
        "1": { label: "Problemas com login ou senha",          tipo: "auto"   },
        "2": { label: "Emitir certificado",                    tipo: "auto"   },
        "3": { label: "Não consigo acessar a plataforma",      tipo: "ticket" },
        "4": { label: "Dúvida sobre um curso ou atividade",    tipo: "ticket" },
        "5": { label: "Outro assunto",                         tipo: "auto"   },
        "6": { label: "🔙 Voltar ao menu anterior",            tipo: "voltar" },
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
        "5": { label: "Outro assunto",                         tipo: "auto"   },
        "6": { label: "🔙 Voltar ao menu anterior",            tipo: "voltar" },
      },
    },
    "3": {
      nome: "Gestor / Ponto Focal",
      emoji: "🏫",
      categorias: {
        "1": { label: "Problemas com login ou senha",          tipo: "auto"   },
        "2": { label: "Cadastrar usuários ou escolas",         tipo: "auto"   },
        "3": { label: "Análise e estatísticas da plataforma",  tipo: "auto"   },
        "4": { label: "Outro assunto",                         tipo: "auto"   },
        "5": { label: "🔙 Voltar ao menu anterior",            tipo: "voltar" },
      },
    },
    // Opção 4 no menu de perfil = voltar ao início (tratada no bot.js)
  },

  // ─── CONTEXTO PARA A IA ──────────────────────────────────────────────────

  CONTEXTO_IA: `Você é o assistente virtual de suporte da plataforma *Learning Passport Brasil*
(brasil.learningpassport.org), um projeto do UNICEF Brasil em parceria com o programa
Territórios Conectados, que atende escolas indígenas, quilombolas e de comunidades
vulneráveis em estados como Roraima, Maranhão, Pernambuco, Rio Grande do Norte e Ceará.

Responda sempre em português brasileiro, de forma clara, acolhedora e objetiva.
Use no máximo 3 parágrafos curtos. Não use markdown complexo — apenas *negrito* e listas simples.

Informações técnicas importantes que você deve conhecer:

ACESSO À PLATAFORMA:
- URL: brasil.learningpassport.org ou acesse também a página https://passaporteparaaprendizagem.casadaarvore.art.br para conhecer seu roteiro de aprendizagem
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
enviar e-mail para o suporte do projeto.
` + knowledge.CONTEXTO_GESTORES,

  // ─── FAQ — RESPOSTAS AUTOMÁTICAS ─────────────────────────────────────────

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

    // FAQ específica de gestores (importada de knowledge.js)
    ...knowledge.FAQ_GESTORES,
  ],

  // ─── CONFIGURAÇÕES GERAIS ────────────────────────────────────────────────

  CONFIG: {
    timeout_sessao_minutos:       30,
    max_mensagens_antes_ticket:   6,
    rodape_ticket:                "Gerado automaticamente pelo bot de suporte — Learning Passport Brasil",
    aba_tickets:                  "Tickets",
    aba_pontos_focais:            "Pontos_Focais",
    colunas_ticket:               ["id", "data", "hora", "nome", "telefone", "email", "perfil", "categoria", "duvida", "status"],
  },

  // ─── BASE DE CONHECIMENTO (importada de knowledge.js) ────────────────────
  // Disponibiliza, para outros módulos do bot, as referências e os blocos
  // estruturados do guia de gestores.

  REFERENCIAS: knowledge.REFERENCIAS,
  KNOWLEDGE:   knowledge.KNOWLEDGE,
};
