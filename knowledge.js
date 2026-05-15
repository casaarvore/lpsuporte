// ═══════════════════════════════════════════════════════════════════════════
// BASE DE CONHECIMENTO — LEARNING PASSPORT BRASIL (Territórios Conectados)
// ═══════════════════════════════════════════════════════════════════════════
// Fonte: "Guia Completo para Gestores — Plataforma Learning Passport".
// Este arquivo concentra o conteúdo de referência usado pelo bot de suporte:
//   • KNOWLEDGE          → blocos temáticos (cursos, relatórios, usuários etc.)
//   • FAQ_GESTORES       → perguntas frequentes específicas de gestores
//   • CONTEXTO_GESTORES  → bloco de texto adicional para o prompt da IA
//
// Editável pela equipe sem conhecimento de programação. Após salvar no
// GitHub, o Render fará o redeploy automático em ~1 minuto.
//
// VERSÃO: 1.0 — base inicial extraída do guia de gestores
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {

  // ─── REFERÊNCIAS GERAIS ─────────────────────────────────────────────────

  REFERENCIAS: {
    portal_aprendiz:        "https://brasil.learningpassport.org",
    painel_admin:           "https://brasil.learningpassport.org/Administration/Home",
    roteiros_externos:      "https://passaporteparaaprendizagem.casadaarvore.art.br/",
    documentacao_oficial:   "https://learn.microsoft.com/en-us/azure/industry/training-services/microsoft-community-training/",
    helpdesk_internacional: "https://sangamhelpdesk.microsoftcrmportals.com/support/create-case/",
    suporte_local_whatsapp: "+55 19 99590-8410",
  },

  // ─── BLOCOS DE CONHECIMENTO ─────────────────────────────────────────────
  // Cada bloco corresponde a uma seção do guia de gestores.

  KNOWLEDGE: {

    acesso_painel_admin: {
      titulo: "Como acessar o painel administrativo",
      passos: [
        "Faça login na plataforma em brasil.learningpassport.org",
        "Clique no ícone de usuário (canto superior direito)",
        "No menu, selecione 'Exibir como um administrador'",
        "Você será redirecionado para brasil.learningpassport.org/Administration/Home",
      ],
      secoes_painel: [
        { icone: "📚", nome: "Conteúdo",       finalidade: "Gerenciar cursos, categorias e roteiros" },
        { icone: "📊", nome: "Análise",        finalidade: "Relatórios e dados de desempenho" },
        { icone: "👥", nome: "Usuários",       finalidade: "Gestão de usuários e grupos" },
        { icone: "⚙️", nome: "Configurações",  finalidade: "Configurações da plataforma" },
        { icone: "❓", nome: "Suporte",        finalidade: "Ajuda e contato" },
      ],
    },

    localizar_cursos: {
      titulo: "Como localizar cursos",
      por_barra_pesquisa:
        "Na tela principal do portal (visão do aluno), use a barra 'Pesquisar cursos ou lições'. "
        + "Funciona pelo nome do curso ou da lição.",
      por_categorias: [
        "Acesse Conteúdo (menu lateral)",
        "Na aba Categorias, use o campo 'Procurar por categorias ou cursos'",
        "Os cursos estão organizados em categorias hierárquicas",
        "Clique na seta (▼/►) ao lado de uma categoria para expandir ou recolher",
      ],
      categorias_ativas: [
        "Comece por aqui!",
        "Cursos Temáticos de até 10h",
        "Cursos Temáticos de 20h a 60h",
        "EDs — Preservação das Culturas e Línguas Indígenas",
        "EDs — Memórias Centenárias",
        "EDs — Cultura e Identidade",
        "EDs — Ambiente e Sustentabilidade",
        "Sobre o Learning Passport",
        "Maués Conectado",
        "Formação LP",
        "Lab OPRINCE",
        "Modelo de Curso/Treinamento",
        "Tecnologias Digitais e Inovação",
        "teste / Treinamento (categorias auxiliares)",
      ],
      por_roteiros:
        "Alterne para a aba 'Roteiros de Aprendizagem' no painel Conteúdo "
        + "e use o campo 'Pesquisar caminhos de aprendizagem'. Os roteiros listam "
        + "grupos temáticos de cursos por perfil de usuário.",
    },

    cadastrar_curso: {
      titulo: "Como cadastrar um novo curso",
      iniciar: [
        "Em Conteúdo > Categorias, localize a categoria onde deseja inserir o curso",
        "Clique em 'Adicionar ou importar o novo curso' (na categoria expandida)",
        "Escolha entre as opções disponíveis (ver tabela abaixo)",
      ],
      opcoes_cadastro: [
        { opcao: "Adicionar o novo curso", descricao: "Cadastro manual com upload de arquivos do computador" },
        { opcao: "Carregamento em Massa",  descricao: "Upload de um arquivo .ZIP com múltiplos cursos" },
        { opcao: "Marketplace",            descricao: "Importar conteúdo pronto do catálogo Learning Passport" },
      ],
      campos_formulario: [
        { campo: "Curso Nome",                            obrigatorio: true,  descricao: "Nome que aparecerá para os alunos" },
        { campo: "Curso Descrição",                       obrigatorio: false, descricao: "Texto descritivo do curso" },
        { campo: "Miniatura De Curso",                    obrigatorio: false, descricao: "Imagem de capa (botão 'Carregar')" },
        { campo: "Offline Sync",                          obrigatorio: false, descricao: "Habilita sincronização offline" },
        { campo: "Restringir a ordenação de lição",       obrigatorio: false, descricao: "Força que o aluno siga a ordem das lições" },
        { campo: "Habilitar certificado",                 obrigatorio: false, descricao: "Emite certificado ao concluir o curso" },
        { campo: "Habilitar formulário de comentários",   obrigatorio: false, descricao: "Habilita link para feedback dos alunos" },
        { campo: "Idioma do curso",                       obrigatorio: true,  descricao: "Português ou Inglês" },
        { campo: "Matrícula do Aluno",                    obrigatorio: true,  descricao: "Controle de inscrição (ver opções abaixo)" },
      ],
      opcoes_matricula: [
        { opcao: "Only admin can enroll learners",   descricao: "Somente administradores matriculam" },
        { opcao: "Self enroll (padrão)",             descricao: "Usuário se matricula por conta própria" },
        { opcao: "Automatically enroll all learners", descricao: "Todos os usuários são matriculados automaticamente" },
      ],
      publicar:
        "Após criar o curso, clique no botão 'Publicar' (canto superior direito) "
        + "para torná-lo visível aos alunos. Cursos não publicados ficam em modo rascunho.",
      curso_em_outro_idioma:
        "Use 'Adicionar curso em um idioma diferente' na aba superior do painel "
        + "para criar versões do mesmo curso em diferentes idiomas.",
    },

    editar_materiais: {
      titulo: "Como editar materiais existentes",
      editar_curso: [
        "No painel de conteúdo, clique no curso desejado",
        "Clique no botão '···' (três pontos) na barra roxa superior",
        "Selecione 'Editar Curso os detalhes'",
        "Edite os mesmos campos do formulário de criação",
      ],
      editar_licao: [
        "Com o curso selecionado, clique sobre uma lição na lista do painel direito",
        "O painel muda para o modo 'Editar Lição'",
        "Campos editáveis: Nome da Lição e Adicionar Conteúdo (substituir arquivo ou link)",
      ],
      reordenar_licoes:
        "Arraste as lições na lista para reposicioná-las (drag and drop). "
        + "Se 'Restringir a ordenação de lição' estiver ativa, a ordem será obrigatória.",
      editar_avaliacao:
        "Clique sobre a avaliação na lista do curso para abrir o editor.",
      carregamento_massa:
        "No menu '···' do curso, selecione 'Lições de carregamento em massa' "
        + "para upload de múltiplas lições via arquivo .ZIP.",
    },

    tipos_materiais: {
      titulo: "Tipos de materiais aceitos",
      formatos_upload: [
        { tipo: "Vídeo",               formato: "mp4, avi e similares" },
        { tipo: "Áudio",               formato: "mp3, wav e similares" },
        { tipo: "PDF",                 formato: ".pdf" },
        { tipo: "Documento de texto",  formato: ".doc, .docx" },
        { tipo: "Apresentação",        formato: ".ppt, .pptx" },
        { tipo: "Planilha",            formato: ".xls, .xlsx" },
        { tipo: "Livro digital",       formato: ".epub" },
        { tipo: "Página web",          formato: ".html" },
        { tipo: "Pacote SCORM",        formato: ".zip (formato obrigatório para SCORM)" },
      ],
      observacao_scorm:
        "Atenção: o formato SCORM não tem registrado corretamente os acessos para certificação. "
        + "Recomenda-se cautela ao adotá-lo em cursos com emissão de certificado.",
      link_externo:
        "Na área de edição da lição, use 'Colar um link' para inserir referência "
        + "a arquivo externo (YouTube, Drive e outros).",
      tipos_avaliacao: [
        { tipo: "Avaliação sem classificação", descricao: "Atividade sem nota formal" },
        { tipo: "Avaliação classificada",      descricao: "Avaliação com nota (pontuação)" },
      ],
      orientacao_avaliacao:
        "Cadastre as questões de cada avaliação, assinale a alternativa correta, "
        + "teste e verifique se estão funcionando plenamente.",
    },

    relatorios: {
      titulo: "Relatórios disponíveis",
      dashboard_geral: {
        local: "Análise > Geral",
        exibe: [
          "Total de usuários na plataforma (com gráfico de crescimento)",
          "Total de conclusões de curso",
          "Indicadores gerais: número de cursos, lições e avaliações",
          "Cursos melhores por registros (ranking com barras de progresso)",
          "Cursos com nenhuma matrícula",
          "Tabela de Categorias: Nome, N.º de Cursos, Curso Registro, Conclusão de Curso (%)",
        ],
        exportacao: "Botão 'Baixar lista' em todas as tabelas, exportação em formato .xlsx",
      },
      por_categoria: [
        "Gráfico de registros de curso ao longo do tempo",
        "Conclusões de Curso (totalizador)",
        "Tabela de Cursos: Nome, N.º de Lições, N.º de Avaliações, Curso Registro, Conclusão (%)",
        "Botão 'Baixar lista' para exportar",
      ],
      por_curso: [
        "Gráfico de registros ao longo do tempo",
        "Conclusões de Curso (totalizador, em aba separada)",
        "Desempenho do Aluno: até 1.000 registros na tela; acima disso, exportar",
        "Tabela com: Nome do aluno, Contato (e-mail), % de Conclusão, Idioma, Lições Concluídas, Avaliações Concluídas",
        "Tabela de Lições: Nome da Lição, Lições Concluídas",
        "Botão 'Baixar lista' em cada seção",
      ],
      cartao_usuario: {
        local: "Seção Usuários, ao clicar em qualquer usuário",
        botao: "Baixar Cartão de Relatório",
        exibe: [
          "Pontuação Média de Avaliação",
          "Cursos Concluídos",
          "Registros do Curso",
          "Grupos Registrados",
          "Caminhos de Aprendizado",
        ],
        abas: ["Cursos registrados", "Grupos registrados", "Roteiros de Aprendizagem"],
      },
      analise_por_categoria_atalho:
        "No menu '···' de qualquer categoria no painel Conteúdo, "
        + "selecione 'Exibir Análises de Dados' para acesso rápido ao relatório.",
    },

    gestao_usuarios: {
      titulo: "Gestão de usuários",
      visualizacao: [
        "'Todos os usuários' lista nome, contato e status (Registrado)",
        "Pesquisa por nome na caixa de busca",
        "'Baixar lista' exporta toda a base de usuários",
      ],
      adicionar: [
        "Adicionar usuário único (formulário individual)",
        "Carregar usuários em massa (upload de planilha)",
        "Importar dados do usuário (botão na parte inferior do painel lateral)",
      ],
      grupos: [
        "Visíveis em 'Meus grupos' no painel lateral",
        "Cada grupo tem menu '···' com opções de gerenciamento",
        "Botão 'Novidades Grupo' cria um novo grupo",
        "Grupos podem ser vinculados a roteiros de aprendizagem e cursos",
      ],
      administradores_globais:
        "Subseção 'Administradores globais' gerencia quem possui acesso administrativo total.",
    },

    configuracoes: {
      titulo: "Configurações da plataforma",
      geral: [
        "Nome do portal: altera o nome exibido em toda a plataforma",
        "Mostrar Termos de Privacidade: ativa ou desativa a aceitação de termos",
        "Idiomas: seleciona quais idiomas estão disponíveis (mais de 50 opções, Português padrão)",
        "Acesso do Usuário Restrito: se ativado, apenas usuários cadastrados pelo admin acessam",
        "Acesso Restrito à Atribuição de Cursos: restringe quais cursos podem ser atribuídos a grupos",
      ],
      identidade_visual: [
        "Logotipo: imagem aplicada ao app web e móvel (botão 'Substituir')",
        "Imagem do banner do site: banner aplicado na versão web",
        "Texto de boas-vindas: até 100 caracteres na página inicial",
        "Cor da marca: cor da barra superior na visão do aprendiz",
        "Título e Mensagem do rodapé",
      ],
      campos_perfil_adicionais: {
        tipos: [
          "Campo de texto (entrada livre)",
          "Opção única (radio button)",
          "Múltipla escolha (checkbox)",
        ],
        ja_configurados: ["Estado", "Cidade", "Função", "Escola"],
      },
      modelos_certificado: {
        existentes: [
          "Territórios Conectados",
          "Jornada Off-line",
          "Educadores Conectados",
          "Lab Criativo",
          "CEFORR",
        ],
        novo:
          "Use o botão '+ Novo Modelo' para criar certificados personalizados. "
          + "Para associar um certificado a um curso, ative 'Habilitar certificado' na edição do curso.",
      },
    },

    roteiros_aprendizagem: {
      titulo: "Roteiros de aprendizagem",
      local: "Conteúdo > Roteiros de Aprendizagem",
      caracteristicas: [
        "Lista todos os roteiros criados (com barra de pesquisa)",
        "Botão 'Novo Roteiro de Aprendizagem' (parte inferior)",
        "Cada roteiro pode agrupar categorias inteiras de cursos",
        "Permite criar trilhas personalizadas por perfil (professores, gestores etc.)",
      ],
      menu_roteiro: [
        "Gerenciar usuários",
        "Gerenciar administradores",
        "Editar Roteiro de Aprendizagem",
        "Excluir Roteiro de Aprendizagem",
      ],
    },

    suporte: {
      titulo: "Suporte",
      local_whatsapp: "+55 19 99590-8410",
      ajuda_oficial: "https://learn.microsoft.com/en-us/azure/industry/training-services/microsoft-community-training/",
      fale_conosco:  "https://sangamhelpdesk.microsoftcrmportals.com/support/create-case/",
      observacao:
        "O botão Suporte no rodapé do menu lateral abre menu flutuante com opções "
        + "de Ajuda (documentação Microsoft Community Training) e Fale Conosco "
        + "(helpdesk para abertura de chamados).",
    },

    interacao_plataforma: {
      titulo: "Interação na plataforma",
      mensagens_diretas: false,
      forum_discussao: false,
      observacao_principal:
        "A plataforma Learning Passport não oferece, nesta instância, fórum de discussão "
        + "nem mensagens diretas entre estudantes e educadores. A interação pedagógica "
        + "ocorre por meio de exercícios automatizados (avaliações classificadas e sem classificação).",
      recursos_externos:
        "Eventualmente, educadores podem inserir, dentro de uma lição, links para "
        + "ferramentas externas que ampliam a interação, como Padlet, Genially, "
        + "formulários (Google Forms, Microsoft Forms) e murais colaborativos.",
      como_inserir_link_externo: [
        "No painel administrativo, acesse o curso e abra a lição desejada",
        "No editor de lição, utilize a opção 'Colar um link'",
        "Cole o endereço (URL) da ferramenta externa",
        "Salve a lição",
      ],
      orientacao_estudante:
        "Caso o estudante encontre, dentro de uma lição, um link externo, "
        + "trata-se de recurso complementar indicado pelo educador. Para dúvidas "
        + "sobre o conteúdo desse recurso, recomenda-se contatar o educador "
        + "ou ponto focal por canais externos à plataforma.",
    },

    dados_e_privacidade: {
      titulo: "Dados pessoais e LGPD",
      base_legal:
        "O tratamento de dados na plataforma observa a Lei Geral de Proteção de Dados "
        + "(Lei nº 13.709/2018 — LGPD), considerando finalidade pedagógica, base legal "
        + "adequada e proteção reforçada para crianças e adolescentes (art. 14).",
      dados_coletados_tipicos: [
        "Nome completo (preenchido no perfil após o cadastro)",
        "Nome de usuário (login na plataforma)",
        "E-mail",
        "Estado, Cidade, Função e Escola (campos adicionais de perfil)",
        "Registros de progresso, conclusão de cursos e desempenho em avaliações",
      ],
      direitos_do_titular: [
        "Confirmar a existência de tratamento dos próprios dados",
        "Acessar e solicitar cópia dos dados",
        "Corrigir dados incompletos, inexatos ou desatualizados",
        "Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários",
        "Solicitar a portabilidade dos dados a outro fornecedor",
        "Revogar o consentimento, quando for a base legal aplicável",
      ],
      menores_de_idade:
        "Para estudantes menores de 18 anos, recomenda-se o cadastro intermediado "
        + "pela escola ou pelo responsável legal, com consentimento específico e "
        + "destacado conforme art. 14 da LGPD.",
      como_solicitar:
        "Solicitações relativas aos direitos previstos na LGPD (acesso, correção, "
        + "exclusão, portabilidade) devem ser encaminhadas ao ponto focal local "
        + "ou ao canal de suporte do projeto, que as direcionará à equipe responsável.",
      orientacao_seguranca: [
        "Não compartilhar nome de usuário e senha com terceiros",
        "Encerrar a sessão ao usar dispositivos compartilhados (escolas, lan houses)",
        "Comunicar imediatamente ao ponto focal qualquer suspeita de uso indevido da conta",
      ],
      observacao_responsabilidade:
        "Para informações detalhadas sobre o tratamento de dados, consulte a "
        + "política de privacidade do projeto Territórios Conectados ou solicite "
        + "esclarecimentos ao ponto focal.",
    },

    ciclo_ticket: {
      titulo: "Ciclo do ticket de suporte",
      prazo_retorno:
        "O prazo médio de retorno é de até 24 horas após a abertura do ticket, "
        + "em dias úteis. Em casos de feriado ou final de semana, o atendimento "
        + "pode ocorrer no próximo dia útil.",
      canal_de_contato:
        "O ponto focal entrará em contato pelo próprio WhatsApp utilizado para "
        + "abertura do ticket ou pelo e-mail cadastrado na plataforma.",
      o_que_informar: [
        "Descrição clara da dúvida ou do problema",
        "Perfil de uso (Estudante, Educador, Gestor / Ponto Focal)",
        "Nome do curso, lição ou avaliação envolvida (quando aplicável)",
        "Dispositivo utilizado (computador, tablet, celular) e tipo de conexão",
        "Captura de tela do erro, quando possível",
      ],
      acompanhamento:
        "O número do ticket (formato LP-AAMMDD-XXXX) deve ser guardado pelo "
        + "usuário para referência. Caso seja necessário fornecer informações "
        + "adicionais ou acompanhar o status, basta mencionar esse número ao "
        + "responder a mensagem do ponto focal.",
      reabertura:
        "Se o problema persistir após o atendimento, o usuário pode abrir um "
        + "novo ticket pelo bot, mencionando o número do ticket anterior na "
        + "descrição da nova dúvida.",
    },

    projeto_pedagogico: {
      titulo: "O projeto Passaporte para a Aprendizagem (Territórios Conectados)",
      descricao:
        "Plataforma digital com cursos, materiais e trilhas formativas voltada à "
        + "formação continuada de educadores e ao desenvolvimento de competências "
        + "digitais na escola. Integra o Territórios Conectados, iniciativa de "
        + "inovação pedagógica e inclusão digital em escolas públicas de diversas "
        + "regiões do Brasil, com foco no fortalecimento da aprendizagem e do "
        + "protagonismo estudantil pela formação docente e pela integração das "
        + "tecnologias ao currículo.",
      iniciativa: ["UNICEF", "Microsoft", "Casa da Árvore Inovação Social", "Projeto Territórios Conectados"],
      site_referencia: "https://passaporteparaaprendizagem.casadaarvore.art.br/",
      publico_atendido: [
        "Equipes técnicas das Redes Públicas de Ensino",
        "Gestores e coordenadores escolares",
        "Professores da Educação Infantil, Anos Iniciais e Anos Finais",
        "Educadores inclusivos",
        "Profissionais de apoio pedagógico",
      ],
      o_que_o_usuario_pode_fazer: [
        "Realizar cursos de formação com certificação",
        "Acessar materiais didáticos alinhados à BNCC",
        "Participar de roteiros de aprendizagem planejados para sua rede pública de ensino",
        "Acompanhar o próprio progresso formativo",
      ],
      tipos_de_materiais: [
        "Cursos autoinstrucionais (de 10h a 60h)",
        "Jornadas formativas",
        "Materiais didáticos temáticos: Memórias Centenárias, Cultura e Identidade, Ambiente e Sustentabilidade, Preservação de Culturas Indígenas",
        "Planos de aula alinhados à BNCC e ao Complemento à BNCC para Computação",
        "Recursos de pensamento computacional",
      ],
      certificacao:
        "Ao concluir os cursos, os participantes recebem certificados digitais "
        + "com a carga horária correspondente. Os certificados podem ser utilizados "
        + "para progressão funcional e como comprovação de formação continuada.",
      roteiros_municipios_estados: [
        "Caucaia (CE)",
        "Alcântara (MA)",
        "Bequimão (MA)",
        "Betânia (PE)",
        "Cerro Corá (RN)",
        "Extremoz (RN)",
        "Lagoa de Velhos (RN)",
        "Pedro Avelino (RN)",
        "Touros (RN)",
        "Roraima (RR — SEED/CEFORR)",
        "Articuladores e Multiplicadores (perfil transversal)",
        "Secretarias de Educação (perfil transversal)",
      ],
      ferramentas_ppp: [
        { nome: "PPP e Cultura Digital", descricao: "Integra as tecnologias digitais aos princípios e práticas pedagógicas do Projeto Político Pedagógico (PPP), em alinhamento à BNCC e ao contexto escolar" },
        { nome: "Autoavaliação do PPP",  descricao: "Diagnóstico com indicadores visuais para identificar pontos fortes e aspectos a aprimorar no PPP da escola" },
        { nome: "O PPP que a Gente Constrói Junto", descricao: "História ilustrada para sensibilização da comunidade escolar sobre o papel coletivo do PPP" },
      ],
      categorias_destaque: [
        "Jornadas Territórios Conectados",
        "Cursos Temáticos (até 10h)",
        "Cursos Temáticos (20h a 60h)",
        "Sobre o Passaporte para a Aprendizagem",
        "Tecnologias Digitais e Inovação",
      ],
    },

  },

  // ─── FAQ ESPECÍFICA DE GESTORES ─────────────────────────────────────────
  // Estas entradas são adicionadas automaticamente ao FAQ principal
  // via require em config.js. Mantêm a mesma estrutura: keywords + resposta.

  FAQ_GESTORES: [
    {
      keywords: ["painel admin", "painel administrativo", "administration", "exibir como administrador", "área admin"],
      resposta:
        `🧭 *Acessar o painel administrativo:*\n\n`
        + `1. Faça login em brasil.learningpassport.org\n`
        + `2. Clique no *ícone de usuário* (canto superior direito)\n`
        + `3. Selecione *"Exibir como um administrador"*\n`
        + `4. Você será levado a brasil.learningpassport.org/Administration/Home\n\n`
        + `O painel possui 5 seções: Conteúdo, Análise, Usuários, Configurações e Suporte.`,
    },
    {
      keywords: ["criar curso", "novo curso", "cadastrar curso", "publicar curso"],
      resposta:
        `📚 *Cadastrar um novo curso:*\n\n`
        + `1. Acesse *Conteúdo > Categorias*\n`
        + `2. Localize a categoria desejada e clique em *"Adicionar ou importar o novo curso"*\n`
        + `3. Escolha *"Adicionar o novo curso"*\n`
        + `4. Preencha os campos obrigatórios: *Curso Nome*, *Idioma do curso* e *Matrícula do Aluno*\n`
        + `5. Clique em *Criar*\n`
        + `6. Adicione lições e clique em *Publicar* para disponibilizar aos alunos\n\n`
        + `Cursos não publicados ficam em modo rascunho.`,
    },
    {
      keywords: ["editar curso", "editar lição", "editar avaliação", "reordenar lições", "drag and drop"],
      resposta:
        `✏️ *Editar materiais existentes:*\n\n`
        + `• *Curso:* clique no curso, depois no botão *"···"* da barra roxa, e selecione *"Editar Curso os detalhes"*\n`
        + `• *Lição:* clique sobre a lição na lista do painel direito\n`
        + `• *Avaliação:* clique sobre a avaliação para abrir o editor\n`
        + `• *Reordenar lições:* arraste e solte na lista (drag and drop)\n\n`
        + `Para upload de várias lições, use *"Lições de carregamento em massa"* no menu "···" do curso.`,
    },
    {
      keywords: ["formato", "formatos", "tipo de arquivo", "scorm", "vídeo", "pdf", "epub", "upload"],
      resposta:
        `📎 *Formatos aceitos para upload:*\n\n`
        + `✔️ Vídeo (mp4, avi)\n`
        + `✔️ Áudio (mp3, wav)\n`
        + `✔️ PDF (.pdf)\n`
        + `✔️ Documentos (.doc, .docx)\n`
        + `✔️ Apresentações (.ppt, .pptx)\n`
        + `✔️ Planilhas (.xls, .xlsx)\n`
        + `✔️ Livro digital (.epub)\n`
        + `✔️ Página web (.html)\n`
        + `✔️ Pacote SCORM (.zip)\n\n`
        + `⚠️ *Atenção:* o SCORM não tem registrado corretamente os acessos para certificação.`,
    },
    {
      keywords: ["avaliação", "prova", "questionário", "classificada", "sem classificação"],
      resposta:
        `📝 *Tipos de avaliação:*\n\n`
        + `• *Avaliação sem classificação:* atividade sem nota formal\n`
        + `• *Avaliação classificada:* avaliação com nota (pontuação)\n\n`
        + `Cadastre as questões, assinale a alternativa correta e teste antes de publicar, `
        + `verificando se estão funcionando plenamente.`,
    },
    {
      keywords: ["relatório", "relatórios", "exportar", "baixar lista", "dashboard", "análise", "desempenho"],
      resposta:
        `📊 *Relatórios disponíveis em Análise:*\n\n`
        + `• *Dashboard Geral:* total de usuários, conclusões de curso, ranking de cursos\n`
        + `• *Por categoria:* registros, conclusões e tabela de cursos\n`
        + `• *Por curso:* desempenho do aluno (até 1.000 registros na tela), tabela de lições\n`
        + `• *Cartão de Relatório individual* (na seção Usuários)\n\n`
        + `Use o botão *"Baixar lista"* para exportar em .xlsx.`,
    },
    {
      keywords: ["usuário", "usuários", "adicionar usuário", "carregar usuários", "importar usuário"],
      resposta:
        `👥 *Gestão de usuários:*\n\n`
        + `Em *Usuários* você pode:\n`
        + `• *Adicionar usuário único* (formulário individual)\n`
        + `• *Carregar usuários em massa* (upload de planilha)\n`
        + `• *Importar dados do usuário* (botão na parte inferior do painel)\n\n`
        + `Use *"Baixar lista"* para exportar a base completa.`,
    },
    {
      keywords: ["grupo", "grupos", "meus grupos", "novo grupo", "novidades grupo"],
      resposta:
        `👨‍👩‍👧 *Grupos de usuários:*\n\n`
        + `Acesse *Usuários > Meus grupos* no painel lateral.\n`
        + `• Crie um novo grupo pelo botão *"Novidades Grupo"*\n`
        + `• Cada grupo tem menu *"···"* com opções de gerenciamento\n`
        + `• Grupos podem ser vinculados a roteiros de aprendizagem e cursos.`,
    },
    {
      keywords: ["modelo de certificado", "novo modelo", "habilitar certificado", "certificado personalizado"],
      resposta:
        `🏆 *Modelos de certificado:*\n\n`
        + `Em *Configurações > Modelos de Certificado* há os modelos: Territórios Conectados, `
        + `Jornada Off-line, Educadores Conectados, Lab Criativo e CEFORR.\n\n`
        + `• Para criar novo modelo: botão *"+ Novo Modelo"*\n`
        + `• Para associar a um curso: ative *"Habilitar certificado"* na edição do curso.`,
    },
    {
      keywords: ["logo", "logotipo", "banner", "identidade visual", "cor da marca", "rodapé"],
      resposta:
        `🎨 *Identidade visual da plataforma:*\n\n`
        + `Em *Configurações > Identidade Visual* edite:\n`
        + `• *Logotipo* (web e móvel)\n`
        + `• *Banner do site*\n`
        + `• *Texto de boas-vindas* (até 100 caracteres)\n`
        + `• *Cor da marca* (barra superior na visão do aprendiz)\n`
        + `• *Título e mensagem do rodapé*`,
    },
    {
      keywords: ["roteiro", "roteiros", "caminho de aprendizagem", "trilha", "novo roteiro"],
      resposta:
        `🗂️ *Roteiros de aprendizagem:*\n\n`
        + `Acesse *Conteúdo > Roteiros de Aprendizagem*.\n`
        + `• Botão *"Novo Roteiro de Aprendizagem"* (parte inferior)\n`
        + `• Cada roteiro pode agrupar categorias inteiras de cursos\n`
        + `• Permite criar trilhas personalizadas por perfil (professores, gestores etc.)\n\n`
        + `Os roteiros indicados estão também em https://passaporteparaaprendizagem.casadaarvore.art.br/`,
    },
    {
      keywords: ["acesso restrito", "termos de privacidade", "idiomas", "configurações gerais"],
      resposta:
        `⚙️ *Configurações gerais da plataforma:*\n\n`
        + `Em *Configurações > Geral* é possível ajustar:\n`
        + `• *Nome do portal*\n`
        + `• *Mostrar Termos de Privacidade*\n`
        + `• *Idiomas* disponíveis (Português é padrão)\n`
        + `• *Acesso do Usuário Restrito* (apenas cadastrados pelo admin)\n`
        + `• *Acesso Restrito à Atribuição de Cursos*`,
    },
    {
      keywords: ["helpdesk", "abrir chamado", "fale conosco", "suporte microsoft", "documentação oficial"],
      resposta:
        `❓ *Suporte avançado:*\n\n`
        + `• *Suporte local (WhatsApp):* +55 19 99590-8410\n`
        + `• *Documentação oficial:* https://learn.microsoft.com/en-us/azure/industry/training-services/microsoft-community-training/\n`
        + `• *Helpdesk (abrir chamado):* https://sangamhelpdesk.microsoftcrmportals.com/support/create-case/`,
    },

    // ── Interação na plataforma ──────────────────────────────────────────
    {
      keywords: [
        "fórum", "forum", "chat", "mensagem", "mensagens", "conversar com professor",
        "falar com educador", "responder professor", "discussão", "discussao",
      ],
      resposta:
        `💬 *Interação na plataforma:*\n\n`
        + `Esta plataforma *não oferece fórum de discussão* nem mensagens diretas `
        + `entre estudantes e educadores. A interação ocorre por meio de `
        + `*exercícios automatizados* (avaliações com ou sem classificação).\n\n`
        + `Eventualmente, dentro de uma lição, o educador pode inserir um *link externo* `
        + `(Padlet, Genially, formulários etc.) como recurso complementar.\n\n`
        + `Para falar com o educador ou ponto focal, utilize os canais externos `
        + `(WhatsApp, e-mail) indicados pela sua escola.`,
    },
    {
      keywords: ["padlet", "genially", "google forms", "formulário externo", "link externo", "ferramenta externa"],
      resposta:
        `🔗 *Inserir link externo em uma lição (educadores e gestores):*\n\n`
        + `1. Acesse o curso no painel administrativo e abra a lição\n`
        + `2. No editor de lição, clique em *"Colar um link"*\n`
        + `3. Cole o endereço (URL) da ferramenta externa: Padlet, Genially, `
        + `Google Forms, Microsoft Forms, mural colaborativo, entre outros\n`
        + `4. Salve a lição\n\n`
        + `O recurso aparecerá para o estudante como um link dentro da lição.`,
    },

    // ── Dados pessoais e LGPD ────────────────────────────────────────────
    {
      keywords: [
        "lgpd", "dados pessoais", "privacidade", "proteção de dados",
        "excluir conta", "apagar conta", "exclusão de dados", "remover dados",
      ],
      resposta:
        `🔒 *Dados pessoais e LGPD:*\n\n`
        + `O tratamento de dados na plataforma observa a *Lei Geral de Proteção de Dados* `
        + `(Lei nº 13.709/2018), com proteção reforçada para crianças e adolescentes.\n\n`
        + `Você tem direito a:\n`
        + `✔️ Acessar e solicitar cópia dos seus dados\n`
        + `✔️ Corrigir dados desatualizados\n`
        + `✔️ Solicitar exclusão de dados desnecessários\n`
        + `✔️ Solicitar a portabilidade dos dados\n`
        + `✔️ Revogar consentimento, quando aplicável\n\n`
        + `Para exercer esses direitos, contate o *ponto focal local* ou abra um ticket `
        + `por este canal de suporte.`,
    },
    {
      keywords: ["menor de idade", "criança", "adolescente", "responsável legal", "consentimento dos pais"],
      resposta:
        `👶 *Cadastro de menores de idade:*\n\n`
        + `Para estudantes menores de 18 anos, recomenda-se que o cadastro seja `
        + `*intermediado pela escola* ou pelo responsável legal, com consentimento `
        + `específico, conforme o art. 14 da LGPD.\n\n`
        + `Em caso de dúvidas, consulte o ponto focal da sua escola.`,
    },
    {
      keywords: ["segurança", "conta hackeada", "uso indevido", "compartilhar senha", "esqueci de sair"],
      resposta:
        `🛡️ *Segurança da sua conta:*\n\n`
        + `✔️ Não compartilhe seu nome de usuário e senha com terceiros\n`
        + `✔️ Encerre a sessão ao usar dispositivos compartilhados (escola, lan house)\n`
        + `✔️ Comunique imediatamente o ponto focal se suspeitar de uso indevido da sua conta\n\n`
        + `Em caso de suspeita de invasão, troque a senha pela opção `
        + `*"Forgot your password?"* na tela de login.`,
    },

    // ── Ciclo do ticket de suporte ───────────────────────────────────────
    {
      keywords: [
        "prazo", "demora", "quando responde", "quanto tempo", "ainda não respondeu",
        "status do ticket", "acompanhar ticket", "número do ticket",
      ],
      resposta:
        `🕒 *Sobre o atendimento do seu ticket:*\n\n`
        + `• *Prazo médio de retorno:* até *24 horas* em dias úteis. `
        + `Em feriados ou finais de semana, o atendimento pode ocorrer no próximo dia útil.\n`
        + `• *Canal de contato:* o ponto focal responderá pelo *próprio WhatsApp* `
        + `usado para abrir o ticket ou pelo *e-mail cadastrado* na plataforma.\n`
        + `• *Acompanhamento:* guarde o número do ticket (formato LP-AAMMDD-XXXX) `
        + `e mencione-o ao responder.\n\n`
        + `Se o problema persistir após o atendimento, abra um novo ticket por `
        + `este canal mencionando o número do ticket anterior.`,
    },

    // ── Projeto e contexto pedagógico ────────────────────────────────────
    {
      keywords: [
        "o que é", "sobre o projeto", "passaporte para aprendizagem", "territórios conectados",
        "quem mantém", "quem desenvolve", "iniciativa", "casa da árvore",
      ],
      resposta:
        `🌍 *Sobre o Passaporte para a Aprendizagem:*\n\n`
        + `Plataforma digital de cursos, materiais e trilhas formativas para a `
        + `*formação continuada de educadores* e o desenvolvimento de competências `
        + `digitais na escola. Integra o *Territórios Conectados*, iniciativa de `
        + `inovação pedagógica e inclusão digital em escolas públicas brasileiras.\n\n`
        + `*Iniciativa:* UNICEF, Microsoft, Casa da Árvore Inovação Social e Projeto Territórios Conectados.\n\n`
        + `Mais informações: https://passaporteparaaprendizagem.casadaarvore.art.br/`,
    },
    {
      keywords: ["para quem", "público", "para qual perfil", "professor", "gestor", "coordenador", "secretaria"],
      resposta:
        `👥 *Para quem é a plataforma:*\n\n`
        + `• Equipes técnicas das Redes Públicas de Ensino\n`
        + `• Gestores e coordenadores escolares\n`
        + `• Professores da Educação Infantil, Anos Iniciais e Anos Finais\n`
        + `• Educadores inclusivos\n`
        + `• Profissionais de apoio pedagógico\n\n`
        + `Há também roteiros para Articuladores, Multiplicadores e Secretarias de Educação.`,
    },
    {
      keywords: ["roteiro", "trilha", "município", "rede de ensino", "minha escola", "qual roteiro"],
      resposta:
        `🗺️ *Roteiros de aprendizagem por município/estado:*\n\n`
        + `Os roteiros disponíveis incluem: Caucaia (CE), Alcântara (MA), Bequimão (MA), `
        + `Betânia (PE), Cerro Corá (RN), Extremoz (RN), Lagoa de Velhos (RN), Pedro Avelino (RN), `
        + `Touros (RN), Roraima (RR — SEED/CEFORR), além dos perfis transversais para `
        + `Articuladores/Multiplicadores e Secretarias de Educação.\n\n`
        + `Acesse o roteiro da sua rede em:\n`
        + `https://passaporteparaaprendizagem.casadaarvore.art.br/`,
    },
    {
      keywords: ["bncc", "computação", "plano de aula", "currículo", "letramento computacional", "pensamento computacional"],
      resposta:
        `📘 *BNCC e BNCC Computação:*\n\n`
        + `A plataforma oferece *planos de aula* desenvolvidos em articulação com a *BNCC* `
        + `e com o *Complemento à BNCC para Computação*, abordando temas como:\n\n`
        + `🌳 Ambiente e Sustentabilidade\n`
        + `🎭 Cultura e Identidade\n`
        + `📝 Memórias Centenárias\n`
        + `🌎 Preservação de Culturas Indígenas\n\n`
        + `Esses materiais apoiam o letramento computacional e a integração curricular `
        + `da Computação em sala de aula.`,
    },
    {
      keywords: ["ppp", "projeto político pedagógico", "projeto politico pedagogico", "autoavaliação ppp"],
      resposta:
        `📋 *Ferramentas para o Projeto Político Pedagógico (PPP):*\n\n`
        + `O projeto disponibiliza três recursos interativos para apoiar a construção, `
        + `revisão e fortalecimento do PPP da escola:\n\n`
        + `💻 *PPP e Cultura Digital*, integra tecnologias digitais ao PPP\n`
        + `📋 *Autoavaliação do PPP*, diagnóstico com indicadores visuais\n`
        + `📖 *O PPP que a Gente Constrói Junto*, história ilustrada para sensibilização\n\n`
        + `Acesse em: https://passaporteparaaprendizagem.casadaarvore.art.br/`,
    },
    {
      keywords: ["progressão funcional", "comprovação", "validade do certificado", "carga horária"],
      resposta:
        `🏆 *Sobre os certificados:*\n\n`
        + `Ao concluir os cursos, o participante recebe *certificado digital* com a *carga horária* `
        + `correspondente. Os certificados podem ser utilizados para *progressão funcional* `
        + `e como comprovação de *formação continuada*.\n\n`
        + `O certificado fica disponível na área do usuário após 100% de conclusão do curso.`,
    },
  ],

  // ─── CONTEXTO ADICIONAL PARA A IA (perfil Gestor) ───────────────────────
  // Bloco anexado ao CONTEXTO_IA do config.js. Fornece à IA conhecimento
  // estruturado sobre o painel administrativo e os fluxos de gestão.

  CONTEXTO_GESTORES: `
CONHECIMENTO ESPECÍFICO PARA O PERFIL GESTOR / PONTO FOCAL:

PAINEL ADMINISTRATIVO:
- URL: brasil.learningpassport.org/Administration/Home
- Acesso: login na plataforma → ícone de usuário → "Exibir como um administrador"
- Cinco seções: Conteúdo, Análise, Usuários, Configurações e Suporte.

CRIAÇÃO E EDIÇÃO DE CURSOS:
- Caminho: Conteúdo > Categorias > "Adicionar ou importar o novo curso".
- Três modos: cadastro manual, carregamento em massa (.zip), importação do Marketplace.
- Campos obrigatórios: Curso Nome, Idioma do curso, Matrícula do Aluno.
- Após criar, é necessário clicar em "Publicar"; cursos não publicados ficam em rascunho.
- Edição: botão "···" na barra roxa do curso > "Editar Curso os detalhes".
- Lições podem ser reordenadas por arrastar e soltar.

TIPOS DE MATERIAIS ACEITOS:
Vídeo (mp4, avi), áudio (mp3, wav), PDF, .doc, .docx, .ppt, .pptx, .xls, .xlsx,
.epub, .html e SCORM (.zip). Atenção: o SCORM não registra corretamente os acessos
para fins de certificação.

AVALIAÇÕES:
Dois tipos: "sem classificação" (sem nota) e "classificada" (com pontuação).
Sempre testar as questões e a alternativa correta antes de publicar.

RELATÓRIOS (Análise):
- Dashboard Geral: usuários, conclusões, ranking de cursos.
- Por categoria: registros, conclusões e tabela de cursos.
- Por curso: desempenho do aluno (até 1.000 registros na tela; acima disso, exportar).
- Cartão de Relatório individual de usuário.
- Exportação em .xlsx pelo botão "Baixar lista".

GESTÃO DE USUÁRIOS:
- Adicionar usuário único, carregar em massa (planilha) ou importar dados.
- Grupos visíveis em "Meus grupos"; criação pelo botão "Novidades Grupo".
- Subseção "Administradores globais" para acesso administrativo total.

CONFIGURAÇÕES:
- Geral: nome do portal, termos de privacidade, idiomas, restrição de acesso.
- Identidade visual: logotipo, banner, texto de boas-vindas (até 100 caracteres),
  cor da marca, rodapé.
- Campos de perfil adicionais: texto, opção única (radio) ou múltipla escolha (checkbox);
  já configurados Estado, Cidade, Função e Escola.
- Modelos de certificado existentes: Territórios Conectados, Jornada Off-line,
  Educadores Conectados, Lab Criativo, CEFORR. Novos modelos pelo botão "+ Novo Modelo".

ROTEIROS DE APRENDIZAGEM:
Em Conteúdo > Roteiros de Aprendizagem. Permitem agrupar categorias inteiras
de cursos e criar trilhas personalizadas por perfil. Roteiros indicados estão
em https://passaporteparaaprendizagem.casadaarvore.art.br/

SUPORTE:
- Local (WhatsApp): +55 19 99590-8410.
- Documentação oficial Microsoft Community Training:
  https://learn.microsoft.com/en-us/azure/industry/training-services/microsoft-community-training/
- Helpdesk (abertura de chamados):
  https://sangamhelpdesk.microsoftcrmportals.com/support/create-case/

INTERAÇÃO NA PLATAFORMA (válido para todos os perfis):
A plataforma NÃO oferece fórum de discussão nem mensagens diretas entre estudantes
e educadores. A interação pedagógica ocorre por meio de exercícios automatizados
(avaliações classificadas e sem classificação). Eventualmente, dentro de uma lição,
o educador pode inserir links externos para ferramentas como Padlet, Genially,
Google Forms, Microsoft Forms ou murais colaborativos, como recursos complementares.
Para falar diretamente com o educador ou ponto focal, o usuário deve usar canais
externos (WhatsApp, e-mail) indicados pela escola.

DADOS PESSOAIS E LGPD:
O tratamento de dados na plataforma observa a Lei Geral de Proteção de Dados
(Lei nº 13.709/2018), com proteção reforçada para crianças e adolescentes (art. 14).
Os direitos do titular incluem: acesso aos próprios dados, correção, exclusão,
portabilidade e revogação de consentimento. Solicitações relativas à LGPD devem
ser encaminhadas ao ponto focal local ou ao canal de suporte do projeto.
Para estudantes menores de 18 anos, recomenda-se o cadastro intermediado pela
escola ou pelo responsável legal, com consentimento específico.

ATENDIMENTO DO TICKET DE SUPORTE:
- Prazo médio de retorno: até 24 horas em dias úteis (em feriados ou finais de semana,
  o atendimento pode ocorrer no próximo dia útil).
- Canal de contato: o ponto focal responderá pelo próprio WhatsApp utilizado para
  abertura do ticket ou pelo e-mail cadastrado na plataforma.
- Acompanhamento: o usuário deve guardar o número do ticket (LP-AAMMDD-XXXX)
  e mencioná-lo em comunicações futuras.
- Reabertura: se o problema persistir, o usuário pode abrir um novo ticket
  mencionando o número do anterior.

CONTEXTO INSTITUCIONAL E PEDAGÓGICO:
O Passaporte para a Aprendizagem é uma plataforma digital de cursos, materiais e
trilhas formativas voltada à formação continuada de educadores e ao desenvolvimento
de competências digitais na escola. Integra o Territórios Conectados, iniciativa
de inovação pedagógica e inclusão digital em escolas públicas brasileiras.
Iniciativa: UNICEF, Microsoft, Casa da Árvore Inovação Social e Projeto Territórios Conectados.
Site de referência: https://passaporteparaaprendizagem.casadaarvore.art.br/

Público atendido: equipes técnicas das Redes Públicas de Ensino, gestores e
coordenadores escolares, professores da Educação Infantil, Anos Iniciais e Anos Finais,
educadores inclusivos e profissionais de apoio pedagógico.

Tipos de materiais: cursos autoinstrucionais (de 10h a 60h), jornadas formativas,
materiais didáticos temáticos (Memórias Centenárias, Cultura e Identidade,
Ambiente e Sustentabilidade, Preservação de Culturas Indígenas), planos de aula
alinhados à BNCC e ao Complemento à BNCC para Computação, e recursos de
pensamento computacional.

Roteiros disponíveis por município/estado: Caucaia (CE), Alcântara (MA), Bequimão (MA),
Betânia (PE), Cerro Corá (RN), Extremoz (RN), Lagoa de Velhos (RN), Pedro Avelino (RN),
Touros (RN), Roraima (RR — SEED/CEFORR), além dos perfis transversais para
Articuladores/Multiplicadores e Secretarias de Educação.

Ferramentas para o Projeto Político Pedagógico (PPP): "PPP e Cultura Digital",
"Autoavaliação do PPP" e "O PPP que a Gente Constrói Junto".

Certificação: ao concluir os cursos, o participante recebe certificado digital
com a carga horária correspondente, que pode ser utilizado para progressão
funcional e como comprovação de formação continuada.
`,

};
