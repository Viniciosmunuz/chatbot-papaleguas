// ═══════════════════════════════════════════════════════════════════
//  🍽️ BOT GARÇOM WEB - RESTAURANTE E LANCHONETE PAPALEGUAS
// ═══════════════════════════════════════════════════════════════════
// Bot automático para receber pedidos via WhatsApp
// ═══════════════════════════════════════════════════════════════════

require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// ─── CONSTANTES ───
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Armazena o estado de conversa de cada usuário
const userStages = {};
// Armazena dados temporários do pedido (nome, pedido, endereço)
const userData = {};
// Tempo de inatividade antes de resetar a conversa (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
// Número do proprietário para receber notificações de pedidos
const ownerNumber = process.env.OWNER_NUMBER || '5592999130838@c.us';

console.log('🍽️ BOT PAPALEGUAS iniciando...');

// ─── FUNÇÕES AUXILIARES ───

/** Aguarda X milissegundos */
const delay = ms => new Promise(res => setTimeout(res, ms));

/** Verifica se mensagem é um gatilho para iniciar (oi, olá, menu, etc) */
const isInitialTrigger = text => 
    /(oi|ola|olá|menu|boa tarde|boa noite|bom dia|oi tudo|olá tudo|e aí|oq|start|help)/i.test(text);

// ─── INICIALIZAR CLIENTE ───

client.on('qr', qr => {
    console.log('\n📱 QR CODE gerado! Escaneie com WhatsApp Web:\n');
    qrcode.generate(qr, { small: true });
    
    // Log detalhado da URL
    console.log('\n' + '═'.repeat(70));
    console.log('🔗 QR CODE URL:');
    console.log('═'.repeat(70));
    console.log(qr);
    console.log('═'.repeat(70));
    console.log('💡 Dica: Use esta URL para gerar um QR code externo!');
    console.log('═'.repeat(70) + '\n');
});

client.on('ready', () => {
    console.log('✅ Bot conectado e pronto para receber pedidos!');
});

client.on('error', error => {
    console.error('❌ Erro:', error.message);
});

client.initialize().catch(error => {
    console.error('❌ Falha ao inicializar:', error.message);
    process.exit(1);
});

// ─── MENSAGENS DO BOT ───

const RESPONSES = {
    // Menu inicial
    BOAS_VINDAS: 'Olá! Bem-vindo(a) ao Restaurante e Lanchonete PAPALEGUAS 🍽️\n\n📋 *CARDÁPIO:* https://drive.google.com/file/d/1-exemplo-cardapio/view?usp=drive_link\n⏰ *HORÁRIO:* Todos os dias 5:30 - 23:30\n💰 *Taxa de Entrega:* R$ 3,00\n\nEscolha uma opção:\n\n1️⃣ Fazer um Pedido\n2️⃣ Falar com Atendente',
    
    // Links e informações
    CARDAPIO_LINK: 'https://drive.google.com/file/d/1-exemplo-cardapio/view?usp=drive_link',
    CARDAPIO_MSG: (link) => `📋 *CARDÁPIO COMPLETO*\n\n👉 ${link}\n\nDeseja fazer um pedido? Digite *2*`,
    HORARIO_FUNCIONAMENTO: '⏰ *HORÁRIO DE FUNCIONAMENTO*\n• Todos os dias: 5:30 - 23:30\n\n💰 Taxa de Entrega: R$ 3,00',
    
    // Fluxo de pedido
    AGUARDANDO_NOME: 'Qual é o seu *Nome Completo*?',
    AGUARDANDO_PEDIDO: (nome) => `Prazer, ${nome}! 🍴\n\n*O que você gostaria de pedir?*`,
    
    AGUARDANDO_ENDERECO: '*Seu Endereço de Entrega?*\n\n(Rua, número, bairro)',
    
    AGUARDANDO_PAGAMENTO: '*Como você prefere pagar?*\n\n1️⃣ Pix\n2️⃣ Dinheiro\n3️⃣ Cartão na entrega',
    
    PEDIDO_TUDO_JUNTO: 'Por favor, envie seu pedido com os seguintes dados:\n\n*📝 Formato:*\nNome: Seu Nome Completo\nPedido: O que você quer comer\nEndereço: Rua, número, bairro\nPagamento: 1 (Pix) / 2 (Dinheiro) / 3 (Cartão)',    PEDIDO_CONFIRMACAO: (nome, pedido, endereco) => 
        `✅ *RESUMO DO PEDIDO*\n\n👤 Nome: ${nome}\n🍽️ Pedido: ${pedido}\n📍 Endereço: ${endereco}\n💰 Taxa: R$ 3,00\n\nTudo certo? Digite *SIM* ou *NÃO*`,
    
    PEDIDO_CONFIRMADO: (nome, pedido, endereco, pagamento) => 
        `✅ *Pedido Confirmado!*\n\n👤 ${nome}\n🍽️ ${pedido}\n📍 ${endereco}\n💳 Pagamento: ${pagamento}\n\n⏳ *Um atendente entrará em contato em breve para:*\n• Confirmar seu pedido\n• Informar o valor total\n• Informar o tempo de entrega\n\nObrigado por escolher PAPALEGUAS! 🍽️`,
    
    // Aviso para o dono
    PEDIDO_AVISO_DONO: (nome, numeroCliente, pedido, endereco) => 
        `🚨 *NOVO PEDIDO* 🚨\n\n👤 Cliente: ${nome}\n📱 https://wa.me/${numeroCliente}\n🍽️ Pedido: ${pedido}\n📍 Endereço: ${endereco}\n💰 Taxa: R$ 3,00\n\n👉 *AÇÃO:* Confirme o pedido, informe o valor total + taxa e o tempo de entrega.`,
    
    // Suporte
    SUPORTE_INICIO: 'Um atendente vai responder em breve! 🎯\nDigite *Menu* para voltar.',
    SUPORTE_AVISO_DONO: (nome, numero) => `👤 *CLIENTE SOLICITANDO ATENDIMENTO*\n\nCliente: ${nome}\n📱 https://wa.me/${numero}`,
    
    // Mensagens padrão
    INATIVIDADE: 'Ficamos inativos por um tempo. Digite *Menu* para recomeçar.',
    RESPOSTA_PADRAO: 'Não entendi. Digite *Menu* para ver as opções.',
};

// ═══════════════════════════════════════════════════════════════════
//                    PROCESSADOR DE MENSAGENS
// ═══════════════════════════════════════════════════════════════════

client.on('message', async (msg) => {
  try {
    const from = msg.from;
    const body = (msg.body || '').trim();

    // 🛑 Ignora grupos
    if (!from || from.endsWith('@g.us')) {
        console.log(`⏭️ Mensagem ignorada: grupo detectado (${from})`);
        return;
    }

    // 🛑 Ignora contatos salvos (apenas números não salvos)
    const contact = await msg.getContact();
    if (contact.isMyContact) {
        console.log(`⏭️ Mensagem ignorada: contato salvo (${contact.name || from})`);
        return;
    }

    console.log(`\n📨 Mensagem de ${contact.name || from}: "${body}"`);

    let state = userStages[from] || null;
    const now = Date.now();

    // ⏱️ Reset se inativo por 30 minutos
    if (state && userData[from]?.lastActivity && (now - userData[from].lastActivity > INACTIVITY_TIMEOUT)) {
        state = null;
        delete userStages[from];
        delete userData[from];
    }

    // Atualizar última atividade
    if (state !== 'SUPORTE') {
        userData[from] = userData[from] || {};
        userData[from].lastActivity = now;
    }

    // UX: simula digitação
    await msg.getChat().then(chat => chat.sendStateTyping());
    await delay(300);

    // Volta ao menu a partir de SUPORTE
    if (state === 'SUPORTE' && isInitialTrigger(body)) {
        await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
        userStages[from] = 'MENU_PRINCIPAL';
        return;
    }

    // Inicia conversa
    if (!state && isInitialTrigger(body)) {
      await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
      userStages[from] = 'MENU_PRINCIPAL';
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📋 MENU PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════
    if (state === 'MENU_PRINCIPAL') {
      if (body === '1') {
        await client.sendMessage(from, RESPONSES.PEDIDO_TUDO_JUNTO);
        userStages[from] = 'AGUARDANDO_DADOS_COMPLETOS';
        userData[from] = userData[from] || {};
        return;
      }
      if (body === '2') {
        const nomeCliente = userData[from]?.nome || 'Cliente';
        const numeroCliente = from.replace('@c.us', '');
        await client.sendMessage(ownerNumber, RESPONSES.SUPORTE_AVISO_DONO(nomeCliente, numeroCliente));
        await client.sendMessage(from, RESPONSES.SUPORTE_INICIO);
        userStages[from] = 'SUPORTE';
        return;
      }
      await client.sendMessage(from, RESPONSES.RESPOSTA_PADRAO);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🛍️ FLUXO DE PEDIDO
    // ═══════════════════════════════════════════════════════════════════
    if (state === 'AGUARDANDO_NOME') {
      await client.sendMessage(from, RESPONSES.PEDIDO_TUDO_JUNTO);
      userStages[from] = 'AGUARDANDO_DADOS_COMPLETOS';
      userData[from] = userData[from] || {};
      return;
    }

    if (state === 'AGUARDANDO_DADOS_COMPLETOS') {
      // Parse dos dados (Nome, Pedido, Endereço, Pagamento)
      const linhas = body.split('\n').map(l => l.trim());
      let nome = '', pedido = '', endereco = '', pagamento = '';
      
      linhas.forEach(linha => {
        if (linha.toLowerCase().startsWith('nome:')) {
          nome = linha.replace(/^nome:\s*/i, '').trim();
        } else if (linha.toLowerCase().startsWith('pedido:')) {
          pedido = linha.replace(/^pedido:\s*/i, '').trim();
        } else if (linha.toLowerCase().startsWith('endereço:') || linha.toLowerCase().startsWith('endereco:')) {
          endereco = linha.replace(/^endere[çc]o:\s*/i, '').trim();
        } else if (linha.toLowerCase().startsWith('pagamento:')) {
          pagamento = linha.replace(/^pagamento:\s*/i, '').trim();
        }
      });
      
      // Validar campos
      if (!nome || !pedido || !endereco || !pagamento) {
        await client.sendMessage(from, '⚠️ Por favor, preencha todos os campos corretamente.\n\n' + RESPONSES.PEDIDO_TUDO_JUNTO);
        return;
      }
      
      // Traduzir pagamento
      const pagamentoMap = {
        '1': 'Pix',
        '2': 'Dinheiro',
        '3': 'Cartão na entrega'
      };
      
      if (!pagamentoMap[pagamento]) {
        await client.sendMessage(from, '⚠️ Pagamento inválido. Use 1 (Pix), 2 (Dinheiro) ou 3 (Cartão).');
        return;
      }
      
      // Salvar dados
      userData[from].nome = nome;
      userData[from].pedido = pedido;
      userData[from].endereco = endereco;
      userData[from].pagamento = pagamentoMap[pagamento];
      
      // Mostrar resumo para confirmar
      await client.sendMessage(from, RESPONSES.PEDIDO_CONFIRMACAO(nome, pedido, endereco));
      userStages[from] = 'PEDIDO_AGUARDANDO_CONFIRMACAO';
      return;
    }

    if (state === 'PEDIDO_AGUARDANDO_CONFIRMACAO') {
      const confirmacao = body.toUpperCase().trim();
      if (confirmacao === 'SIM' || confirmacao === 'S') {
        const { nome, pedido, endereco, pagamento } = userData[from];
        const numeroCliente = from.replace('@c.us', '');
        await client.sendMessage(from, RESPONSES.PEDIDO_CONFIRMADO(nome, pedido, endereco, pagamento));
        await delay(1000);
        await client.sendMessage(ownerNumber, RESPONSES.PEDIDO_AVISO_DONO(nome, numeroCliente, pedido, endereco));
        userStages[from] = 'PEDIDO_CONFIRMADO';
        return;
      }
      if (confirmacao === 'NÃO' || confirmacao === 'NAO' || confirmacao === 'N') {
        await client.sendMessage(from, `Pedido cancelado.\n\n${RESPONSES.BOAS_VINDAS}`);
        userStages[from] = 'MENU_PRINCIPAL';
        delete userData[from];
        return;
      }
      await client.sendMessage(from, '⚠️ Digite *SIM* ou *NÃO*');
      return;
    }

    if (state === 'PEDIDO_CONFIRMADO') {
        if (isInitialTrigger(body)) {
            await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
            userStages[from] = 'MENU_PRINCIPAL';
            delete userData[from];
            return;
        }
    }

    // Forma livre de pedido (opção 2)
    if (state === 'PEDIDO_FORMA_LIVRE') {
        if (isInitialTrigger(body)) {
            await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
            userStages[from] = 'MENU_PRINCIPAL';
            delete userData[from];
            return;
        }
        
        const numeroCliente = from.replace('@c.us', '');
        const nomeCliente = userData[from]?.nome || 'Cliente';
        
        // Enviar o pedido para o dono
        const avisoFormaLivre = `🚨 *PEDIDO RECEBIDO (FORMA LIVRE)* 🚨\n\n👤 Cliente: ${nomeCliente}\n📱 https://wa.me/${numeroCliente}\n\n📝 Mensagem:\n${body}\n\n👉 *AÇÃO:* Verifique com o cliente os detalhes (nome, endereço, forma de pagamento) e informe o valor.`;
        
        await client.sendMessage(ownerNumber, avisoFormaLivre);
        await client.sendMessage(from, '✅ Seu pedido foi enviado!\n\n⏳ Um atendente entrará em contato em breve para confirmar os detalhes.');
        userStages[from] = 'PEDIDO_CONFIRMADO';
        return;
    }

    // Resposta padrão se não encaixar em nenhum estado
    if (state !== 'SUPORTE' && !isInitialTrigger(body)) {
        await client.sendMessage(from, RESPONSES.RESPOSTA_PADRAO);
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
});
