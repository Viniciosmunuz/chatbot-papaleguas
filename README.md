# Bot WhatsApp - Espaço Polaroid 📸

Bot de atendimento automático que gerencia pedidos de fotos Polaroid, orçamentos de eventos e serviços de drone.

## ⚡ Quick Start

```bash
npm install
node chatbot.js
```

## 🔧 Configuração

Crie um arquivo `.env`:

```env
OWNER_NUMBER=55XXXXXXXXXXXX@c.us
```

**Formato:** `55` + `DDD` + `Número` + `@c.us` (sem espaços)

Na primeira execução, escaneie o QR code com WhatsApp para autenticar.

## ✨ Funcionalidades

- ✅ Menu com 5 opções
- ✅ Pedidos (nome, quantidade, endereço)
- ✅ Orçamentos (eventos e drone)
- ✅ Suporte automático
- ✅ Captura de mídia (fotos/vídeos)
- ✅ Máquina de estados
- ✅ Timeout após 30 min inatividade
- ✅ Bloqueia grupos e contatos salvos

## 📂 Estrutura

```
├── chatbot.js       # Lógica principal
├── test-bot.js      # Teste interativo
├── package.json     # Dependências
├── .env            # Configurações (não commitado)
└── README.md       # Este arquivo
```

## 🎯 Fluxos

| Opção | Fluxo |
|-------|-------|
| **1** | Link do catálogo |
| **2** | Pedido: Nome → Qtd → Endereço |
| **3** | Orçamento: Tipo → Data |
| **4** | Suporte humano |
| **5** | Drone: Nome |

## 🔍 Desenvolvedor

Mensagens estão centralizadas em `RESPONSES`. Para editar:

```javascript
// Em chatbot.js
const RESPONSES = {
  MENU: 'Seu novo menu aqui...',
  // ... outras respostas
};
```

## 📝 Notas

- Bot ignora automaticamente grupos e contatos salvos
- Estados são mantidos por usuário
- Dados são limpos ao fim do fluxo
- Código otimizado e limpo
- Sem dependências desnecessárias

## 🚀 Deploy

Use BotCloud, Render ou servidor próprio. Precisará de Node.js 14+.
