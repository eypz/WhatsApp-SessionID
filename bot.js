const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(config.token, { polling: true });

const pluginsDir = path.join(__dirname, 'plugins');
fs.readdirSync(pluginsDir).forEach(file => {
  if (file.endsWith('.js') && file !== 'index.js') { 
    const plugin = require(path.join(pluginsDir, file));
    if (plugin.command && plugin.handler && typeof plugin.handler === 'function') {
      bot.onText(new RegExp(plugin.command), plugin.handler.bind(null, bot));
      console.log(`Loaded plugin: ${plugin.command}`);
    }
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Welcome to Multi-Wave Bot Please select an option:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Get Quote', callback_data: 'quote' },
          { text: 'Weather (coming soon)', callback_data: 'weather' }
        ],
        [
          { text: 'GitHub (coming soon)', callback_data: 'github' },
          { text: 'tiktok (coming soon)', callback_data: 'tiktok' }
        ]
      ]
    }
  });
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

  switch (action) {
    case 'quote':
      const quotePlugin = require(path.join(pluginsDir, 'quote.js'));
      await quotePlugin.handler(bot, { chat: { id: chatId } });
      break;
    case 'weather':
      bot.sendMessage(chatId, 'Weather feature is coming soon');
      break;
    case 'github':
      bot.sendMessage(chatId, 'GitHub notifications feature is coming soon');
      break;
    case 'tiktok':
      bot.sendMessage(chatId, 'Tiktok video downloader coming');
      break;
    default:
      break;
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Invalid command. Use /start to see available commands');
});

console.log('Bot is running...');
