# Guia de Implantação — Bot de Suporte Learning Passport Brasil

> Tempo estimado: **2 a 3 horas** na primeira vez  
> Custo mensal: Z-API ~R$ 99 + Claude API ~US$ 5–15 + Render (gratuito)

---

## Visão geral do sistema

```
Usuário envia mensagem pelo WhatsApp
        ↓
Z-API recebe e encaminha para o servidor (webhook)
        ↓
Servidor (Render) processa com o bot + Claude IA
        ↓
Resposta enviada de volta ao usuário
        ↓
Tickets salvos no Google Sheets
        ↓
Equipe acessa o painel web para gestão
```

---

## PARTE 1 — Conta Google e Google Sheets

### 1.1 Criar a planilha

1. Acesse [sheets.google.com](https://sheets.google.com) com a conta Google do projeto
2. Crie uma **nova planilha** e nomeie como: `Suporte Learning Passport`
3. **Crie duas abas** (clique no "+" no rodapé):
   - Renomeie a primeira aba para: `Tickets`
   - Crie e nomeie a segunda para: `Pontos_Focais`
4. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/   ESTE_TRECHO_É_O_ID   /edit
   ```
   Guarde esse ID — você vai precisar dele.

### 1.2 Criar Service Account no Google Cloud

> A Service Account é uma "conta técnica" que o bot usa para escrever na planilha.

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um **novo projeto** (ex: `lp-suporte`)
3. No menu lateral: **APIs e Serviços → Biblioteca**
4. Busque e ative: **Google Sheets API**
5. Vá em: **APIs e Serviços → Credenciais**
6. Clique em **Criar Credenciais → Conta de serviço**
7. Dê um nome (ex: `bot-suporte`) e clique em **Criar e continuar**
8. Pule as etapas opcionais e clique em **Concluído**
9. Na lista de contas de serviço, clique na que você criou
10. Vá na aba **Chaves → Adicionar chave → Criar nova chave → JSON**
11. O arquivo JSON será baixado — **guarde-o com segurança**

### 1.3 Compartilhar a planilha com a Service Account

1. Abra o arquivo JSON baixado e copie o valor do campo `client_email`
   (será algo como `bot-suporte@lp-suporte.iam.gserviceaccount.com`)
2. Abra sua planilha do Google Sheets
3. Clique em **Compartilhar** (botão verde no canto superior direito)
4. Cole o e-mail da Service Account
5. Defina permissão como **Editor**
6. Clique em **Enviar** (pode ignorar o aviso de "não tem conta Google")

---

## PARTE 2 — Z-API (WhatsApp)

### 2.1 Criar conta e instância

1. Acesse [z-api.io](https://z-api.io) e crie sua conta
2. No painel, clique em **Nova Instância**
3. Dê um nome (ex: `lp-suporte`) e conclua a criação
4. Na instância criada, anote:
   - **Instance ID**
   - **Token**
   - **Client Token** (aba "Segurança")

### 2.2 Conectar o número de WhatsApp

1. Na instância, clique em **Conectar**
2. Um QR Code aparecerá — escaneie com o WhatsApp do número de suporte
   (Menu → Dispositivos conectados → Conectar dispositivo)
3. Aguarde a confirmação de conexão (ícone verde)

> ⚠️ **Use um número dedicado** — não use seu número pessoal.  
> O número ficará conectado como "WhatsApp Web" permanentemente.

### 2.3 Configurar o Webhook (faça isso após o Render estar no ar)

1. Na instância Z-API, vá em **Webhooks**
2. Em "Webhook ao receber", cole:
   ```
   https://SEU-PROJETO.onrender.com/webhook
   ```
3. Salve. O Z-API enviará todas as mensagens recebidas para esse endereço.

---

## PARTE 3 — Render (servidor)

### 3.1 Criar conta e conectar o repositório

1. Acesse [render.com](https://render.com) e crie conta com GitHub
2. No GitHub, crie um **repositório privado** chamado `lp-suporte`
3. Faça upload de todos os arquivos do projeto para esse repositório

### 3.2 Criar o serviço Web no Render

1. No Render, clique em **New → Web Service**
2. Conecte ao repositório `lp-suporte`
3. Configure:
   - **Name:** `lp-suporte`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Clique em **Create Web Service**

### 3.3 Configurar as variáveis de ambiente

No painel do serviço Render, vá em **Environment** e adicione:

| Variável | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Sua chave da Anthropic |
| `ZAPI_INSTANCE_ID` | ID da instância Z-API |
| `ZAPI_TOKEN` | Token da instância Z-API |
| `ZAPI_CLIENT_TOKEN` | Client Token Z-API |
| `GOOGLE_SHEET_ID` | ID da planilha do Google Sheets |
| `GOOGLE_CREDENTIALS_JSON` | Conteúdo completo do arquivo JSON (em uma linha) |

> **Como colocar o JSON em uma linha:**  
> Abra o arquivo JSON em um editor de texto, selecione tudo e cole diretamente  
> no campo de valor — o Render aceita JSON multilinha nas variáveis de ambiente.

### 3.4 Verificar o deploy

1. Aguarde o build finalizar (~2 min)
2. Acesse `https://SEU-PROJETO.onrender.com/api/status`
3. Se retornar `{"ok":true,...}`, o servidor está funcionando

---

## PARTE 4 — Chave da API Claude (Anthropic)

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Vá em **API Keys → Create Key**
3. Dê um nome (ex: `lp-suporte`) e copie a chave gerada
4. Adicione à variável `ANTHROPIC_API_KEY` no Render

> O plano pago da Anthropic começa com crédito de US$ 5.  
> Para o volume esperado (suporte educacional), o custo mensal deve ficar  
> entre US$ 3 e US$ 15 dependendo do número de atendimentos.

---

## PARTE 5 — Teste final

1. Envie uma mensagem para o número de WhatsApp conectado
2. O bot deve responder com a saudação inicial
3. Siga o fluxo até gerar um ticket
4. Acesse `https://SEU-PROJETO.onrender.com` para ver o ticket no painel
5. Verifique se a linha foi salva na planilha do Google Sheets

---

## Como atualizar as orientações do bot

Para editar as respostas, menus e FAQ, basta abrir o arquivo **`config.js`** no repositório GitHub e editar diretamente. As seções mais importantes são:

| Seção | O que faz |
|---|---|
| `MENSAGENS` | Todos os textos que o bot envia |
| `PERFIS` | Perfis de usuário e menus de categoria |
| `CONTEXTO_IA` | Instruções para o Claude — aqui você descreve a plataforma |
| `FAQ` | Respostas automáticas para dúvidas comuns (sem gastar API) |

Após salvar o arquivo no GitHub, o Render fará o redeploy automaticamente em ~1 minuto.

> **Não é necessário saber programação** para editar o `config.js`.  
> Os textos estão claramente identificados e separados da lógica do sistema.

---

## Manutenção cotidiana

| Tarefa | Como fazer |
|---|---|
| Ver tickets abertos | Acesse o painel web |
| Alterar status de ticket | Diretamente na planilha ou no painel |
| Cadastrar ponto focal | Aba "Pontos Focais" no painel |
| Ver logs do bot | Render → seu serviço → aba "Logs" |
| Reiniciar o bot | Render → seu serviço → botão "Manual Deploy" |
| Desconectar WhatsApp | Z-API → sua instância → Desconectar |

---

## Problemas frequentes

**Bot não responde:**
- Verifique se o número está conectado no Z-API (ícone verde)
- Confirme que o webhook aponta para a URL correta do Render
- Veja os logs no Render

**Erro "502" no painel:**
- O Render (plano gratuito) "dorme" após 15 min sem uso
- A primeira mensagem pode demorar ~30 segundos para acordar o servidor
- Normal no plano gratuito — o plano pago (US$7/mês) elimina isso

**Tickets não aparecem na planilha:**
- Verifique se o e-mail da Service Account tem permissão de Editor na planilha
- Confirme que a variável `GOOGLE_CREDENTIALS_JSON` está completa e correta
- Veja os logs no Render para mensagens de erro do módulo Sheets

---

*Documentação gerada para o projeto Territórios Conectados — UNICEF Brasil*
