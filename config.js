// ═══════════════════════════════════════════════════════════════════════════
// ARQUIVO DE CONFIGURAÇÃO — LEARNING PASSPORT SUPORTE
// ═══════════════════════════════════════════════════════════════════════════
// Este arquivo pode ser editado pela equipe sem conhecimento de programação.
// Após editar, salve o arquivo no GitHub — o Render atualizará em ~1 minuto.
//
// VERSÃO: 3.0 — fluxo de coleta mínima inicial
//   • Boas-vindas pede o nome (aceita primeiro nome ou completo)
//   • Telefone vem do Z-API, sem confirmação prévia
//   • E-mail só é solicitado no momento de abrir ticket
//   • Categoria foi eliminada; a IA recebe perfil + dúvida aberta
//   • Indexa a base de conhecimento knowledge.js (REFERENCIAS, KNOWLEDGE,
//     FAQ_GESTORES, CONTEXTO_GESTORES, KNOWLEDGE_SYNTHESIS)
// ═══════════════════════════════════════════════════════════════════════════

const knowledge = require("./knowledge");

module.exports = {

  // ─── MENSAGENS DO BOT ────────────────────────────────────────────────────

  MENSAGENS: {
    boas_vindas:
      `Olá! 👋 Bem-vindo ao suporte do *Passaporte para Aprendizagem (Learning Passport)* 🌍\n\n`
      + `Sou o assistente virtual do projeto Territórios Conectados.\n\n`
      + `Para começarmos, qual é o seu *nome*?\n`
      + `_(Pode digitar o nome completo ou apenas o primeiro nome.)_`,

    selecionar_perfil: (primeiroNome) =>
      `Prazer em te atender, *${primeiroNome}*! 🤝\n\n`
      + `📖 Aproveite para conhecer nossa página, com *tutoriais, roteiros de aprendizagem, perguntas frequentes* e *guias de acesso à plataforma*:\n`
      + `🔗 https://passaporteparaaprendizagem.casadaarvore.art.br\n\n`
      + `Para te ajudar melhor por aqui, qual é o seu perfil?\n\n`
      + `1️⃣ Sou *Estudante*\n`
      + `2️⃣ Sou *Educador*\n`
      + `3️⃣ Sou *Gestor* / Ponto Focal`,

    solicitar_municipio_estado: (primeiroNome) =>
      `Antes de prosseguir, *${primeiroNome}*, de qual *município* e *estado* você é?\n`
      + `_(Pode digitar tudo junto, por exemplo: Caucaia, CE. Se preferir não informar, digite "pular".)_`,

    solicitar_escola:
      `Obrigado! E em qual *escola* ou *secretaria* você atua?\n`
      + `_(Digite o nome completo da instituição. Se preferir não informar, digite "pular".)_`,

    digitar_duvida: (primeiroNome) =>
      `Perfeito, *${primeiroNome}*! 💬\n\n`
      + `Em que posso te ajudar hoje? Descreva sua dúvida com o máximo de detalhes possível.`,

    // Saudação exibida quando o telefone já está cadastrado na aba Usuarios
    boas_vindas_retorno: (primeiroNome) =>
      `Olá, *${primeiroNome}*! 👋 Tem algo mais que eu possa te ajudar?\n\n`
      + `_Pode descrever sua dúvida abaixo. Caso seus dados (escola, perfil ou e-mail) tenham mudado, `
      + `me avise ao final do atendimento para abrirmos um ticket de atualização._`,

    // Exibido após resposta automática (FAQ ou IA)
    pos_resposta_automatica:
      `E aí, essa resposta te ajudou? 😊\n\n`
      + `1️⃣ ✅ Sim, está resolvido!\n`
      + `2️⃣ 💬 Quero fazer mais uma pergunta\n`
      + `3️⃣ 📋 Gostaria de contato humano assim que possível (abrir um ticket)`,

    // Exibido quando a IA não consegue processar a pergunta (retorno nulo da API
    // ou falha técnica). Oferece encaminhamento para atendimento humano sem que
    // o usuário precise reformular a pergunta ou clicar em opções intermediárias.
    nao_compreendi_oferecer_ticket:
      `🤔 *Desculpe, não compreendi sua pergunta.*\n\n`
      + `Mas posso encaminhar para *contato humano*. Você tem interesse?\n\n`
      + `1️⃣ ✅ Sim, quero contato humano (abrir ticket)\n`
      + `2️⃣ 💬 Não, vou reformular minha pergunta`,

    // Avaliação enviada automaticamente após atendimento humano (timeout de
    // inatividade de 30 minutos ou comando #avaliar do ponto focal).
    avaliacao_pos_humano: (primeiroNome) =>
      `🙋 Olá, *${primeiroNome || "tudo bem"}*!\n\n`
      + `O ponto focal te atendeu há pouco. Como foi a sua experiência?\n\n`
      + `1️⃣ ✅ Tudo resolvido!\n`
      + `2️⃣ 💬 Tenho uma nova dúvida (posso te ajudar?)\n`
      + `3️⃣ 📅 Preciso agendar uma reunião por Google Meet\n`
      + `4️⃣ 📋 Quero abrir um novo ticket para outro assunto`,

    // Solicita descrição detalhada do problema antes de abrir o ticket
    solicitar_descricao_problema:
      `📝 *Antes de abrir seu ticket*, por favor descreva o seu problema com o `
      + `*máximo de detalhes possível*.\n\n`
      + `_Quanto mais informações você fornecer (tela onde aconteceu, mensagem de erro, `
      + `dispositivo usado, etc.), mais ágil será o atendimento._`,

    // Solicita o e-mail apenas no momento de abrir o ticket
    solicitar_email_ticket:
      `Obrigado pela descrição! Agora, para que o ponto focal possa retornar pelo *e-mail* `
      + `(além deste WhatsApp), por favor informe seu endereço.\n\n`
      + `_(Digite "pular" se preferir não informar.)_`,

    // Exibido após ticket registrado (mensagem 1 de 2: confirmação)
    ticket_aberto: (id) =>
      `✅ *Ticket ${id} registrado com sucesso!*\n\n`
      + `🕒 *Prazo de retorno:* até *24 horas* em dias úteis.\n`
      + `_(Em feriados ou finais de semana, o atendimento pode ocorrer no próximo dia útil.)_\n\n`
      + `📞 *Como você será contatado:* o ponto focal responderá pelo *próprio WhatsApp* `
      + `(este número, +55 19 99590-8410) ou pelo *e-mail* informado.\n\n`
      + `📌 Guarde o número *${id}* para acompanhar sua solicitação.`,

    // Oferta de pausa enviada como segunda mensagem após ticket_aberto
    oferta_pausa:
      `🤖 *Deseja interromper as mensagens automáticas por 30 minutos*, `
      + `para que o ponto focal possa te atender com tranquilidade?\n\n`
      + `*S* — Sim, pausar por 30 minutos\n`
      + `*N* — Não, manter o bot disponível`,

    // Confirmação após o usuário escolher pausar o bot
    pausa_confirmada:
      `🔇 *Mensagens automáticas pausadas por 30 minutos.*\n\n`
      + `O ponto focal entrará em contato em breve por este WhatsApp ou pelo e-mail informado.\n\n`
      + `_Após esse período, você receberá uma mensagem para avaliarmos como foi o atendimento._`,

    // Reenvia as opções pós-ticket se o usuário digitar algo inválido
    ticket_aberto_opcoes: () =>
      `O que deseja fazer agora?\n\n`
      + `1️⃣ 💬 Fazer outra pergunta\n`
      + `2️⃣ 👋 Encerrar`,

    encerramento: (primeiroNome) =>
      `Ótimo! Fico feliz em ter ajudado, *${primeiroNome}*! 🎉\n\n`
      + `Se precisar de algo, é só chamar. Tenha um ótimo dia!`,

    nao_entendido:
      `Desculpe, não entendi. Por favor, responda com o *número* da opção desejada.`,

    erro_tecnico:
      `Ocorreu um erro interno. Por favor, tente novamente em alguns instantes `
      + `ou entre em contato com o suporte pelo WhatsApp +55 19 99590-8410.`,
  },

  // ─── BOTÕES INTERATIVOS ─────────────────────────────────────────────────
  // Conjuntos de botões enviados como UI clicável via Z-API. Cada botão tem
  // id (que precisa coincidir com o valor esperado pelo bot.js) e label
  // (máximo 20 caracteres). O usuário também pode digitar o id manualmente
  // como alternativa, mantendo retrocompatibilidade.

  BOTOES: {
    perfil: [
      { id: "1", label: "🎓 Estudante" },
      { id: "2", label: "📚 Educador" },
      { id: "3", label: "🏫 Gestor" },
    ],
    avaliacao: [
      { id: "1", label: "✅ Resolvido!" },
      { id: "2", label: "💬 Outra pergunta" },
      { id: "3", label: "📋 Contato humano" },
    ],
    pausa: [
      { id: "S", label: "✅ Sim, pausar" },
      { id: "N", label: "❌ Não, manter bot" },
    ],
    incompreensao: [
      { id: "1", label: "✅ Contato humano" },
      { id: "2", label: "💬 Vou reformular" },
    ],
    pos_ticket: [
      { id: "1", label: "💬 Outra pergunta" },
      { id: "2", label: "👋 Encerrar" },
    ],
  },

  // ─── PERFIS DE USUÁRIO ───────────────────────────────────────────────────
  // A partir da versão 3.0 do bot, as categorias foram eliminadas: o usuário
  // descreve a dúvida diretamente após informar o perfil. A IA e a FAQ
  // recebem perfil + dúvida e respondem; o ticket é aberto apenas se a
  // resposta automática não resolver.

  PERFIS: {
    "1": { nome: "Estudante",             emoji: "🎓" },
    "2": { nome: "Educador",              emoji: "📚" },
    "3": { nome: "Gestor / Ponto Focal", emoji: "🏫" },
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

REGRAS OBRIGATÓRIAS DA SENHA (aplicam-se à criação e à redefinição):
- Mínimo de 8 caracteres
- Deve conter ao menos uma letra minúscula (a-z)
- Deve conter ao menos uma letra maiúscula (A-Z)
- Deve conter um dígito (número) OU um símbolo (caractere especial, por exemplo: *)
- Exemplo de senha válida: v151824M*

MENSAGEM DE ERRO EXIBIDA PELA PLATAFORMA quando a senha não atende às regras (em inglês):
"The password must have minimum 8 characters and contain: a lowercase letter, an uppercase letter, and a digit / symbol."

Tradução para o português:
"A senha deve ter no mínimo 8 caracteres e conter: uma letra minúscula, uma letra maiúscula, e um dígito ou símbolo."

Quando o usuário copiar ou mencionar essa mensagem em inglês, ou disser que a senha "não é aceita", "está fraca" ou "não funciona", reproduza a mensagem original, sua tradução e as quatro regras de forma didática.

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
      keywords: [
        "não consigo acessar", "nao consigo acessar", "não consigo entrar",
        "nao consigo entrar", "acesso", "não acessa", "nao acessa",
        "plataforma não abre", "plataforma nao abre", "site fora do ar",
        "não funciona", "nao funciona", "não entra", "nao entra",
        "conseguindo entrar", "conseguindo acessar", "estou entrando",
        "consigo entrar", "consigo acessar", "não estou conseguindo"
      ],
      resposta:
        `🔍 *Não está conseguindo acessar a plataforma?*\n\n`
        + `Vamos verificar juntos algumas possibilidades. Tente, na ordem:\n\n`
        + `*1. Confirme o endereço de acesso*\n`
        + `O endereço correto é: brasil.learningpassport.org\n`
        + `(em letras minúsculas, sem espaços e sem "www")\n\n`
        + `*2. Verifique a conexão com a Internet*\n`
        + `Confirme se o Wi-Fi ou os dados móveis estão ativos. `
        + `Se você está usando o *Hub Offline*, conecte-se à rede *LearningPassport* `
        + `(senha: learningpassport).\n\n`
        + `*3. Teste em janela anônima*\n`
        + `Abra uma janela anônima (ou privada) no navegador e tente acessar novamente. `
        + `Isso elimina problemas de cache.\n\n`
        + `*4. Verifique sua senha*\n`
        + `Se aparecer "senha incorreta", clique em *"Forgot your password?"* `
        + `na tela de login para redefinir.\n\n`
        + `*5. Erro 502 ou tela em branco?*\n`
        + `A plataforma pode estar reiniciando. Aguarde *5 minutos* e tente novamente.\n\n`
        + `Se nada disso resolver, ao final desta mensagem responda *"2"* para abrir um ticket. `
        + `Um ponto focal entrará em contato em até 24 horas.`,
    },
    {
      keywords: [
        "senha", "password", "esqueci", "recuperar", "login",
        "esqueci usuario", "esqueci usuário", "esqueci o login",
        "esqueci nome de usuario", "esqueci nome de usuário", "perdi senha",
        "criar senha", "nova senha", "redefinir senha", "trocar senha", "mudar senha"
      ],
      resposta:
        `🔑 *Recuperação de senha:*\n\n`
        + `1. Acesse brasil.learningpassport.org\n`
        + `2. Clique em "Iniciar sessão"\n`
        + `3. Clique em *"Forgot your password?"*\n`
        + `4. Digite seu e-mail ou nome de usuário\n`
        + `5. Verifique sua caixa de entrada (e a pasta de SPAM)\n\n`
        + `*Regras para a nova senha:*\n`
        + `✔️ No mínimo *8 caracteres*\n`
        + `✔️ Ao menos *uma letra minúscula* (a-z)\n`
        + `✔️ Ao menos *uma letra maiúscula* (A-Z)\n`
        + `✔️ Ao menos *um dígito (número)* ou *símbolo* (por exemplo: *)\n\n`
        + `_Exemplo de senha válida:_ *v151824M\\**\n\n`
        + `Se você viu a mensagem _"The password must have minimum 8 characters and contain: `
        + `a lowercase letter, an uppercase letter, and a digit / symbol."_, é exatamente isso `
        + `que ela está pedindo.\n\n`
        + `Se não lembrar o nome de usuário, contate o ponto focal da sua escola `
        + `ou o *Suporte Técnico* pelo WhatsApp +55 19 99590-8410.`,
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
      keywords: [
        "502", "bad gateway", "erro", "não abre", "não carrega",
        "travou", "travada", "ficou parado", "ficou parada",
        "deu pau", "lentidão", "lenta", "fora do ar", "caiu"
      ],
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
        `📶 *Hub Offline (uso sem Internet na escola):*\n\n`
        + `A plataforma só funciona offline nas escolas que possuem o dispositivo Hub.\n\n`
        + `Se a sua escola tem o Hub:\n`
        + `1. Abra as configurações de Wi-Fi do seu dispositivo\n`
        + `2. Selecione a rede: *LearningPassport*\n`
        + `3. Senha: *learningpassport* (tudo minúsculo, sem espaços)\n`
        + `4. Abra o navegador e acesse o endereço informado pelo gestor\n\n`
        + `A luz azul no dispositivo indica que está funcionando corretamente.`,
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
    // Liga/desliga o envio de mensagens com botões interativos via Z-API.
    // ⚠️ MANTIDO COMO `false` enquanto o suporte do plano Z-API ao endpoint
    // /send-button-actions não for confirmado. Sintomas de incompatibilidade:
    // bot fica em silêncio após perguntar o nome (ou em qualquer ponto que
    // tenha botões). Quando o suporte for confirmado pelo time da Z-API,
    // alterar para `true` aqui — não precisa mexer em mais nenhum arquivo.
    usar_botoes:                  false,

    timeout_sessao_minutos:       30,
    max_mensagens_antes_ticket:   6,
    rodape_ticket:                "Gerado automaticamente pelo bot de suporte — Learning Passport Brasil",
    aba_tickets:                  "Tickets",
    aba_pontos_focais:            "Pontos_Focais",
    aba_atendimentos:             "Atendimentos",
    aba_usuarios:                 "Usuarios",
    colunas_ticket:               ["id", "data", "hora", "nome", "telefone", "email", "perfil", "municipio_estado", "escola", "duvida", "status"],
    colunas_atendimento:          ["data", "hora", "telefone", "perfil", "duvida", "resposta", "origem", "email", "municipio_estado", "escola", "virou_ticket"],
    colunas_usuario:              ["telefone", "nome_completo", "primeiro_nome", "perfil_id", "perfil_nome", "municipio_estado", "escola", "email", "primeira_interacao", "ultima_interacao"],
  },

  // ─── BASE DE CONHECIMENTO (importada de knowledge.js) ────────────────────
  // Disponibiliza, para outros módulos do bot, as referências e os blocos
  // estruturados do guia de gestores. KNOWLEDGE_SYNTHESIS é a versão
  // compacta usada pela IA para respostas mais precisas (ver claude.js).

  REFERENCIAS:         knowledge.REFERENCIAS,
  KNOWLEDGE:           knowledge.KNOWLEDGE,
  KNOWLEDGE_SYNTHESIS: knowledge.KNOWLEDGE_SYNTHESIS,
};
