require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// ═══════════════════════════════════════════════════════════════════
//                       CONFIGURAÇÕES GERAIS
// ═══════════════════════════════════════════════════════════════════

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        🍽️  BOT RESTAURANTE PAPALEGUAS INICIANDO...            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📦 Criando cliente WhatsApp...');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const userStages = {};
const userData = {};
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const ownerNumber = process.env.OWNER_NUMBER || '5592999130838@c.us';

console.log('✅ Configurações carregadas');
console.log('📱 Número do proprietário:', ownerNumber);
console.log('⏳ Aguardando conexão com WhatsApp...\n');

// ═══════════════════════════════════════════════════════════════════
//                      FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════

const delay = ms => new Promise(res => setTimeout(res, ms));
const isInitialTrigger = text => /(oi|ola|olá|menu|boa tarde|boa noite|bom dia|olá papaleguas|oi papaleguas)/i.test(text);

// ═══════════════════════════════════════════════════════════════════
//                    INICIALIZAÇÃO DO CLIENTE
// ═══════════════════════════════════════════════════════════════════

client.on('qr', qr => {
    try {
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                     QR CODE GERADO!                           ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
        
        qrcode.generate(qr, { small: true });
        
        console.log('\n' + '═'.repeat(70));
        console.log('📱 QR CODE URL:');
        console.log('═'.repeat(70));
        console.log(qr);
        console.log('═'.repeat(70));
        console.log('💡 Dica: Escaneie o QR code acima com seu WhatsApp Web para conectar!');
        console.log('═'.repeat(70) + '\n');
    } catch (error) {
        console.error('❌ Erro ao gerar QR code:', error.message);
    }
});

client.on('ready', () => {
    console.log('✅ Bot WhatsApp conectado e pronto para receber mensagens!');
});

client.on('error', error => {
    console.error('❌ ERRO NO BOT:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ ERRO NÃO TRATADO:', error);
});

console.log('🔄 Inicializando cliente WhatsApp...');
client.initialize().catch(error => {
    console.error('❌ ERRO ao inicializar:', error.message);
    process.exit(1);
});

// ═══════════════════════════════════════════════════════════════════
//                    RESPOSTAS CENTRALIZADAS
// ═══════════════════════════════════════════════════════════════════

const RESPONSES = {
    BOAS_VINDAS: 'Olá! Bem-vindo(a) ao Restaurante e Lanchonete PAPALEGUAS 🍽️\n\nSomos um espaço aconchegante oferecendo deliciosas opções de comida. Escolha uma opção:\n\n1️⃣ Ver Cardápio\n2️⃣ Fazer um Pedido\n3️⃣ Falar com Atendente',
    
    CARDAPIO_LINK: 'https://drive.google.com/file/d/1-exemplo-cardapio/view?usp=drive_link',
    
    CARDAPIO_MSG: (link) => `📋 *Confira nosso Cardápio Completo*\n\n👉 ${link}\n\nTemos várias opções de pratos deliciosos!\n\n💡 *Deseja fazer um pedido?*\nDigite *2* para fazer seu pedido!`,
    
    HORARIO_FUNCIONAMENTO: '\n⏰ *HORÁRIO DE FUNCIONAMENTO*\n• Segunda a Quinta: 11h - 22h\n• Sexta e Sábado: 11h - 23h\n• Domingo: 12h - 22h\n\nTaxa de Entrega: R$ 3,00',
    
    AGUARDANDO_NOME: 'Ótimo! Vamos começar seu pedido 😊\n\nQual é o seu *Nome Completo*?',
    
    AGUARDANDO_PEDIDO: (nome) => `Prazer, ${nome}! 🍴\n\n*O que você gostaria de pedir?*\n\nPor favor, descreva os itens que deseja (você pode consultar nosso cardápio digitando o link que enviamos).`,
    
    AGUARDANDO_ENDERECO: '*Qual é o seu Endereço de Entrega?*\n\n(Rua, número, bairro, complemento)',
    
    PEDIDO_CONFIRMACAO: (nome, pedido, endereco) => `✅ *Resumo do Pedido*\n\n👤 Nome: ${nome}\n🍽️ Pedido: ${pedido}\n📍 Endereço: ${endereco}\n💰 Taxa de Entrega: R$ 3,00\n\n*Tudo certo?*\nDigite:\n👉 *SIM* para confirmar\n👉 *NÃO* para cancelar`,
    
    PEDIDO_CONFIRMADO: (nome, pedido, endereco) => `✅ *Pedido Confirmado!*\n\n👤 Nome: ${nome}\n🍽️ Pedido: ${pedido}\n📍 Endereço: ${endereco}\n💰 Taxa de Entrega: R$ 3,00\n\n⏳ *Aguardando confirmação...*\nUm atendente entrará em contato em breve para confirmar seu pedido e informar o tempo de preparo! ⏱️`,
    
    PEDIDO_AVISO_DONO: (nome, numeroCliente, pedido, endereco) => `🚨 *NOVO PEDIDO RECEBIDO* 🚨\n\n👤 Cliente: ${nome}\n📱 WhatsApp: https://wa.me/${numeroCliente}\n🍽️ Pedido: ${pedido}\n📍 Endereço: ${endereco}\n💰 Taxa de Entrega: R$ 3,00\n\n👉 *AÇÃO:* Confirme o pedido, calcule o valor total e envie o tempo estimado de entrega.`,
    
    SUPORTE_INICIO: 'Ok! Um atendente humano já vai te responder em instantes! 🎯\n\nDigite *Menu* para voltar ao menu principal.',
    
    SUPORTE_AVISO_DONO: (nomeCliente, numeroCliente) => `👤 *CLIENTE SOLICITANDO ATENDIMENTO* 👤\n\nCliente: ${nomeCliente}\n📱 WhatsApp: https://wa.me/${numeroCliente}\n\n👉 *AÇÃO:* Entre em contato com o cliente para ajudá-lo.`,
    
    INATIVIDADE: 'Olá! Parece que ficamos inativos por um tempo. Para recomeçar, digite *Menu* ou escolha uma opção:',
    
    RESPOSTA_PADRAO: 'Desculpe, não consegui entender sua última mensagem. Digite *Menu* para ver as opções ou aguarde nosso atendimento!',
};

// ═══════════════════════════════════════════════════════════════════
//                    HANDLER DE MENSAGENS
// ═══════════════════════════════════════════════════════════════════

client.on('message', async (msg) => {
  try {
    const from = msg.from;
    const body = (msg.body || '').trim();

    // 🛑 Bloqueia grupos
    if (!from || from.endsWith('@g.us')) return;

    // 🛑 Bloqueia contatos salvos
    const contact = await msg.getContact();
    if (contact.isMyContact) return;

    let state = userStages[from] || null;
    const now = Date.now();

    // ⏱️ Verifica inatividade (30 minutos)
    if (state && userData[from]?.lastActivity && (now - userData[from].lastActivity > INACTIVITY_TIMEOUT)) {
        await client.sendMessage(from, RESPONSES.INATIVIDADE);
        state = null;
        delete userStages[from];
        delete userData[from];
    }

    // Atualiza timestamp de atividade
    if (state !== 'SUPORTE') {
        userData[from] = userData[from] || {};
        userData[from].lastActivity = now;
    }

    // Simula digitação (UX mais humano)
    await msg.getChat().then(chat => chat.sendStateTyping());
    await delay(300);

    // Sair de SUPORTE com "Menu"
    if (state === 'SUPORTE' && isInitialTrigger(body)) {
        await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
        userStages[from] = 'MENU_PRINCIPAL';
        return;
    }

    // Iniciar conversa
    if (!state && isInitialTrigger(body)) {
      await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
      userStages[from] = 'MENU_PRINCIPAL';
      return;
    }

    // 📋 MENU PRINCIPAL
    if (state === 'MENU_PRINCIPAL') {
      if (body === '1') {
        await client.sendMessage(from, RESPONSES.CARDAPIO_MSG(RESPONSES.CARDAPIO_LINK));
        await client.sendMessage(from, RESPONSES.HORARIO_FUNCIONAMENTO);
        return;
      }
      if (body === '2') {
        await client.sendMessage(from, RESPONSES.AGUARDANDO_NOME);
        userStages[from] = 'AGUARDANDO_NOME';
        userData[from] = userData[from] || {};
        return;
      }
      if (body === '3') {
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

    // 🛍️ FUNIL: PEDIDO
    if (state === 'AGUARDANDO_NOME') {
      userData[from].nome = body;
      const nomeCurto = userData[from].nome.split(" ")[0];
      await client.sendMessage(from, RESPONSES.AGUARDANDO_PEDIDO(nomeCurto));
      userStages[from] = 'AGUARDANDO_PEDIDO';
      return;
    }

    if (state === 'AGUARDANDO_PEDIDO') {
      if (body.length > 3) {
          userData[from].pedido = body;
          await client.sendMessage(from, RESPONSES.AGUARDANDO_ENDERECO);
          userStages[from] = 'AGUARDANDO_ENDERECO';
          return;
      }
      await client.sendMessage(from, '⚠️ Por favor, descreva seu pedido com mais detalhes.');
      return;
    }

    if (state === 'AGUARDANDO_ENDERECO') {
      userData[from].endereco = body;
      const { nome, pedido, endereco } = userData[from];
      await client.sendMessage(from, RESPONSES.PEDIDO_CONFIRMACAO(nome, pedido, endereco));
      userStages[from] = 'PEDIDO_AGUARDANDO_CONFIRMACAO';
      return;
    }

    if (state === 'PEDIDO_AGUARDANDO_CONFIRMACAO') {
      const confirmacao = body.toUpperCase().trim();
      if (confirmacao === 'SIM' || confirmacao === 'S') {
        const { nome, pedido, endereco } = userData[from];
        const numeroCliente = from.replace('@c.us', '');
        await client.sendMessage(from, RESPONSES.PEDIDO_CONFIRMADO(nome, pedido, endereco));
        await delay(1000);
        await client.sendMessage(ownerNumber, RESPONSES.PEDIDO_AVISO_DONO(nome, numeroCliente, pedido, endereco));
        userStages[from] = 'PEDIDO_CONFIRMADO';
        return;
      }
      if (confirmacao === 'NÃO' || confirmacao === 'NAO' || confirmacao === 'N') {
        await client.sendMessage(from, `Pedido cancelado. Voltando ao menu...\n\n${RESPONSES.BOAS_VINDAS}`);
        userStages[from] = 'MENU_PRINCIPAL';
        delete userData[from];
        return;
      }
      await client.sendMessage(from, '⚠️ Por favor, digite *SIM* para confirmar ou *NÃO* para cancelar.');
      return;
    }

    if (state === 'PEDIDO_CONFIRMADO') {
        if (isInitialTrigger(body)) {
            await client.sendMessage(from, RESPONSES.BOAS_VINDAS);
            userStages[from] = 'MENU_PRINCIPAL';
            delete userData[from];
            return;
        }
        if (body.length > 0) {
             await client.sendMessage(from, 'Seu pedido foi confirmado! Um atendente entrará em contato em breve com mais informações.');
             return;
        }
    }

    // Resposta padrão
    if (state !== 'SUPORTE' && state !== 'PEDIDO_CONFIRMADO' && !isInitialTrigger(body)) {
        await client.sendMessage(from, RESPONSES.RESPOSTA_PADRAO);
    }

  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
  }
});
